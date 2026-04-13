import { z } from "zod";

const phoneRegex = /^[6-9]\d{9}$/;
const ifscRegex  = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const pincodeRegex = /^\d{6}$/;

const AddEmployeeSchema = z.object({
  fullName: z.string().min(2).max(100).regex(/^[a-zA-Z\s.'-]+$/),
  email: z.string().email().max(255).toLowerCase(),
  phone: z.string().regex(phoneRegex),
  state: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  idProofType: z.enum(["aadhaar", "pan", "voter_id", "passport"]),

  altPhone: z.string().regex(phoneRegex).optional().or(z.literal("")),
  addressLine1: z.string().min(5).max(200).optional().or(z.literal("")),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  pincode: z.string().regex(pincodeRegex).optional().or(z.literal("")),
  bankAccount: z.string().min(9).max(18).regex(/^\d+$/).optional().or(z.literal("")),
  bankIfsc: z.string().regex(ifscRegex).toUpperCase().optional().or(z.literal("")),
  bankName: z.string().min(2).max(100).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

const payload = {
  fullName: "Rakshit Patil",
  email: "rakshitpatil9798@gmail.com",
  phone: "6363217424",
  state: "Karnataka",
  city: "Bangalore",
  idProofType: "aadhaar",
  altPhone: "",
  addressLine1: "",
  addressLine2: "",
  pincode: "560049",
  bankAccount: "",
  bankIfsc: "",
  bankName: "",
  notes: ""
};

const result = AddEmployeeSchema.safeParse(payload);
if (!result.success) {
  console.log(JSON.stringify(result.error.issues, null, 2));
} else {
  console.log("Success");
}
