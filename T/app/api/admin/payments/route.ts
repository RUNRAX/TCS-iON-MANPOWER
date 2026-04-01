import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAdmin, parseBody, ok, created, conflict, notFound, serverError, auditLog } from "@/lib/utils/api";
import { ClearPaymentSchema } from "@/lib/validations/schemas";
import { notifyEmployee, MESSAGE_TEMPLATES } from "@/lib/whatsapp/service";
import { format } from "date-fns";

export const GET = withAdmin(async () => {
  const supabase = createAdminClient();

  // 1. Fetch payments with shift info (payments FK → exam_shifts works fine)
  const { data: payments, error: payErr } = await supabase
    .from("payments")
    .select(`id, amount, status, reference_number, cleared_at, notes, created_at,
      employee_id, shift_id,
      shift:exam_shifts(exam_date, shift_number, start_time, end_time, venue)`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (payErr) {
    console.error("[payments endpoint error]: ", payErr);
    return serverError();
  }

  // 2. Separately fetch employee names (no FK from payments → employee_profiles)
  const employeeIds = [...new Set((payments ?? []).map(p => p.employee_id).filter(Boolean))];
  let empLookup: Record<string, { full_name: string; phone: string }> = {};
  if (employeeIds.length > 0) {
    const { data: empData } = await supabase
      .from("employee_profiles")
      .select("user_id, full_name, phone")
      .in("user_id", employeeIds);
    for (const e of empData ?? []) {
      empLookup[e.user_id] = { full_name: e.full_name, phone: e.phone };
    }
  }

  return ok({
    payments: (payments ?? []).map(p => {
      const emp = empLookup[p.employee_id] ?? { full_name: "Unknown", phone: "" };
      return {
        id: p.id,
        employeeId: p.employee_id,
        shiftId: p.shift_id,
        employeeName: emp.full_name,
        phone: emp.phone,
        shiftDate: (p.shift as any)?.exam_date,
        shiftNumber: (p.shift as any)?.shift_number,
        venue: (p.shift as any)?.venue,
        amountRupees: (p.amount ?? 0) / 100,
        status: p.status,
        referenceNumber: p.reference_number,
        clearedAt: p.cleared_at,
      };
    }),
  });
});

export const POST = withAdmin(async (request, { userId }) => {
  const parsed = await parseBody(request, ClearPaymentSchema);
  if ("error" in parsed) return parsed.error;

  const { employeeId, shiftId, amountRupees, referenceNumber, notes } = parsed.data;
  const supabase = createAdminClient();

  const { data: existingPayment } = await supabase
    .from("payments").select("id, status")
    .eq("employee_id", employeeId).eq("shift_id", shiftId).maybeSingle();

  if (existingPayment?.status === "cleared") return conflict("Already cleared.");

  const { data: payment, error } = await supabase.from("payments")
    .upsert({
      employee_id: employeeId, shift_id: shiftId,
      amount: Math.round(amountRupees * 100), status: "cleared",
      reference_number: referenceNumber || null, notes: notes || null,
      cleared_by: userId, cleared_at: new Date().toISOString(),
    }, { onConflict: "employee_id,shift_id" })
    .select().single();

  if (error || !payment) return serverError();

  // WhatsApp notification
  try {
    const [{ data: emp }, { data: shift }] = await Promise.all([
      supabase.from("employee_profiles").select("full_name, phone").eq("user_id", employeeId).single(),
      supabase.from("exam_shifts").select("exam_date, shift_number").eq("id", shiftId).single(),
    ]);
    if (emp && shift) {
      await notifyEmployee({
        employeeId, toPhone: emp.phone, type: "payment_cleared", title: "Payment Cleared",
        message: MESSAGE_TEMPLATES.paymentCleared({
          employeeName: emp.full_name, examDate: format(new Date(shift.exam_date), "dd MMM yyyy"),
          shiftNumber: shift.shift_number, amountRupees,
          referenceNumber: referenceNumber || undefined,
          loginUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
        }),
      });
    }
  } catch {}

  await auditLog({ userId, action: "payment.clear", entityType: "payment", entityId: payment.id, after: { employeeId, shiftId, amountRupees }, request });
  return created({ payment: { ...payment, amountRupees }, message: `₹${amountRupees} cleared.` });
});
