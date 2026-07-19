// UpdateProfile.jsx - Doctor Profile Update with Medical Theme
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import ShiftManagement from "./ShiftManagement";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  User,
  Edit,
  Upload,
  AlertCircle,
  ArrowLeft,
  FileText,
  GraduationCap,
  Briefcase,
  Building2,
  Phone,
  Mail,
  Calendar,
  Stethoscope,
  CheckCircle2,
  ReceiptText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getDoctorProfile,
  updateDoctorDocuments,
  updateDoctorProfile,
  updateDoctorProfilePic,
} from "@/services/doctorApi";

const normalizeShifts = (doctor) => {
  const source = doctor?.shift || doctor?.shifts || doctor?.availability || [];

  if (!Array.isArray(source)) return [];

  return source
    .map((shift) => ({
      day: shift.day || shift.dayOfWeek || "",
      starttime: shift.starttime || shift.startTime || "",
      endtime: shift.endtime || shift.endTime || "",
      patientslot: Number(shift.patientslot || shift.patientSlots || shift.slotDuration || 30),
    }))
    .filter((shift) => shift.day && shift.starttime && shift.endtime);
};

const PATIENT_API_BASE_URL =
  import.meta.env.VITE_PATIENT_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL?.replace("/doctor", "/patient") ||
  "http://192.168.1.67:8000/api/v1/patient";

const normalizeDepartmentValue = (value = "") => value.toString().trim().toLowerCase();

const UpdateProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, loading, error } = useSelector((state) => state.doctor || {});

  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [citizenshipDocument, setCitizenshipDocument] = useState(null);
  const [medicalDegree, setMedicalDegree] = useState(null);
  const [medicalLicense, setMedicalLicense] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [pictureSaving, setPictureSaving] = useState(false);
  const [documentSaving, setDocumentSaving] = useState(false);


  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchProfile = () => {
    dispatch(getDoctorProfile());
  };

  useEffect(() => {
    fetchProfile();
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;

    axios
      .get(`${PATIENT_API_BASE_URL}/departments`, { withCredentials: true })
      .then((res) => {
        if (!mounted) return;
        const records = Array.isArray(res.data?.data) ? res.data.data : [];
        setDepartments(records);
      })
      .catch(() => {
        if (mounted) setDepartments([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (profile) {
      reset({
        doctorname: profile.doctorname,
        email: profile.email,
        phonenumber: profile.phonenumber,
        age: profile.age,
        sex: profile.sex,
        experience: profile.experience,
        qualification: profile.qualification,
        consultationfee: profile.consultationfee ?? 0,
        specialization: profile.specialization,
        department: normalizeDepartmentValue(profile.department),
      });
      setShifts(normalizeShifts(profile));
      setProfilePicPreview(profile.verificationdocument?.profilepicture);
    }
  }, [profile, reset]);

  useEffect(() => {
    if (profilePicFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(profilePicFile);
    }
  }, [profilePicFile]);

  const onSubmit = async (data) => {
    if (shifts.length === 0) {
      toast.error("Please add at least one availability schedule.");
      return;
    }

    const submitData = { ...data };
    delete submitData.doctorname;
    delete submitData.email;
    delete submitData.consultationfee;
    submitData.shift = shifts;
    setProfileSaving(true);
    try {
      const res = await dispatch(updateDoctorProfile(submitData));
      if (res.meta.requestStatus === "fulfilled") {
        toast.success("Profile updated successfully!");
        fetchProfile();
      } else {
        toast.error(res.payload?.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("❌ Update Error:", err);
      toast.error("Something went wrong!");
    } finally {
      setProfileSaving(false);
    }
  };

  const onPictureSubmit = async () => {
    if (!profilePicFile) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("profilepicture", profilePicFile);

    setPictureSaving(true);
    try {
      const res = await dispatch(updateDoctorProfilePic(formData));
      if (res.meta.requestStatus === "fulfilled") {
        toast.success("Profile picture updated successfully!");
        fetchProfile();
        setProfilePicFile(null);
      } else {
        toast.error(res.payload?.message || "Failed to update profile picture");
      }
    } catch (error) {
      toast.error("Something went wrong while updating profile picture!");
    } finally {
      setPictureSaving(false);
    }
  };

  const onDocumentSubmit = async () => {
    if (!citizenshipDocument && !medicalDegree && !medicalLicense) {
      toast.error("Please select at least one document");
      return;
    }

    const formData = new FormData();
    if (citizenshipDocument) formData.append("citizenshipdocument", citizenshipDocument);
    if (medicalDegree) formData.append("medicaldegree", medicalDegree);
    if (medicalLicense) formData.append("medicallicense", medicalLicense);

    setDocumentSaving(true);
    try {
      const res = await dispatch(updateDoctorDocuments(formData));
      if (res.meta.requestStatus === "fulfilled") {
        toast.success("Documents updated successfully!");
        fetchProfile();
        setCitizenshipDocument(null);
        setMedicalDegree(null);
        setMedicalLicense(null);
      } else {
        toast.error(res.payload?.message || "Failed to update documents");
      }
    } catch (error) {
      toast.error("Something went wrong while updating documents!");
    } finally {
      setDocumentSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-linear-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const departmentOptions = departments
    .map((department) => {
      const label = department.deptname || department.name || "";
      return {
        label,
        value: normalizeDepartmentValue(label),
      };
    })
    .filter((department) => department.label && department.value);

  const currentDepartment = normalizeDepartmentValue(profile?.department);
  const displayedDepartmentOptions =
    currentDepartment && !departmentOptions.some((department) => department.value === currentDepartment)
      ? [{ label: profile.department, value: currentDepartment }, ...departmentOptions]
      : departmentOptions;

  const consultationFee = Number(profile?.consultationfee ?? 0);

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-linear-to-br from-teal-50 via-emerald-50 to-cyan-50 py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">
              <Edit className="w-3 h-3 mr-1" />
              Update Profile
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Edit Your Profile
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Keep your professional information up to date
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Picture & Documents */}
            <div className="space-y-6">
              {/* Profile Picture Card */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-600" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <img
                        src={profilePicPreview || "/placeholder-user.png"}
                        alt="Profile"
                        className="w-32 h-32 rounded-full border-4 border-teal-100 object-cover shadow-lg"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-teal-600 rounded-full p-2 shadow-md">
                        <Stethoscope className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProfilePicFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                      />
                      {profilePicFile && (
                        <Button
                          type="button"
                          onClick={onPictureSubmit}
                          disabled={pictureSaving}
                          className="w-full gap-2 bg-linear-to-r from-teal-600 to-emerald-600"
                        >
                          {pictureSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          Upload Picture
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Upload Card */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    Update Documents
                  </CardTitle>
                  <CardDescription>
                    Upload citizenship, medical license, and degree certificates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Citizenship Card */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Citizenship Card</Label>
                    {profile?.verificationdocument?.citizenshipdocument && !citizenshipDocument && (
                      <a
                        href={profile.verificationdocument.citizenshipdocument}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs font-semibold text-teal-700 hover:text-teal-800"
                      >
                        Current citizenship card uploaded
                      </a>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setCitizenshipDocument(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    />
                    {citizenshipDocument && (
                      <p className="text-xs text-teal-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {citizenshipDocument.name}
                      </p>
                    )}
                  </div>

                  {/* Medical Degree */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Medical Degree</Label>
                    {profile?.verificationdocument?.medicaldegree && !medicalDegree && (
                      <a
                        href={profile.verificationdocument.medicaldegree}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs font-semibold text-teal-700 hover:text-teal-800"
                      >
                        Current medical degree uploaded
                      </a>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setMedicalDegree(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    />
                    {medicalDegree && (
                      <p className="text-xs text-teal-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {medicalDegree.name}
                      </p>
                    )}
                  </div>

                  {/* Medical License */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Medical License</Label>
                    {profile?.verificationdocument?.medicallicense && !medicalLicense && (
                      <a
                        href={profile.verificationdocument.medicallicense}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs font-semibold text-teal-700 hover:text-teal-800"
                      >
                        Current medical license uploaded
                      </a>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setMedicalLicense(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    />
                    {medicalLicense && (
                      <p className="text-xs text-teal-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {medicalLicense.name}
                      </p>
                    )}
                  </div>

                  {(citizenshipDocument || medicalDegree || medicalLicense) && (
                    <Button
                      type="button"
                      onClick={onDocumentSubmit}
                      disabled={documentSaving}
                      className="w-full gap-2 bg-linear-to-r from-teal-600 to-emerald-600"
                    >
                      {documentSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload Documents
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Profile Information */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Edit className="w-6 h-6 text-teal-600" />
                    Professional Information
                  </CardTitle>
                  <CardDescription>
                    Update your professional details and contact information
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-teal-600" />
                        Personal Details
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="doctorname">Full Name *</Label>
                          <Input
                            id="doctorname"
                            readOnly
                            {...register("doctorname")}
                            className="bg-slate-100 text-slate-500"
                          />
                          <p className="text-xs text-slate-500">Managed by admin.</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-1">
                            <Mail className="w-4 h-4 text-gray-500" />
                            Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            readOnly
                            {...register("email")}
                            className="bg-slate-100 text-slate-500"
                          />
                          <p className="text-xs text-slate-500">Login email is fixed by admin.</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phonenumber" className="flex items-center gap-1">
                            <Phone className="w-4 h-4 text-gray-500" />
                            Phone Number *
                          </Label>
                          <Input
                            id="phonenumber"
                            type="tel"
                            {...register("phonenumber", {
                              required: "Phone is required",
                              pattern: { value: /^[0-9]{10}$/, message: "Phone must be 10 digits" },
                            })}
                            className={errors.phonenumber ? "border-red-500" : ""}
                          />
                          {errors.phonenumber && (
                            <p className="text-red-500 text-xs">{errors.phonenumber.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="age" className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            Age
                          </Label>
                          <Input
                            id="age"
                            type="number"
                            min="0"
                            {...register("age", {
                              required: "Age is required",
                              min: { value: 0, message: "Age cannot be negative" },
                            })}
                            className={errors.age ? "border-red-500" : ""}
                          />
                          {errors.age && (
                            <p className="text-red-500 text-xs">{errors.age.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sex">Gender</Label>
                          <Select onValueChange={(value) => setValue("sex", value)} defaultValue={profile?.sex}>
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="z-50 border border-slate-200 bg-white shadow-xl">
                              <SelectItem value="Male" className="bg-white hover:bg-teal-50">Male</SelectItem>
                              <SelectItem value="Female" className="bg-white hover:bg-teal-50">Female</SelectItem>
                              <SelectItem value="Others" className="bg-white hover:bg-teal-50">Others</SelectItem>
                            </SelectContent>
                          </Select>
                          <input type="hidden" {...register("sex", { required: "Gender is required" })} />
                          {errors.sex && (
                            <p className="text-red-500 text-xs">{errors.sex.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Professional Information Section */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-teal-600" />
                        Professional Details
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="department" className="flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            Department *
                          </Label>
                          <select
                            id="department"
                            {...register("department", { required: "Department is required" })}
                            className={`h-11 w-full rounded-md border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 ${
                              errors.department ? "border-red-500" : "border-gray-300"
                            }`}
                          >
                            <option value="">Select department</option>
                            {displayedDepartmentOptions.map((department) => (
                              <option key={department.value} value={department.value}>
                                {department.label}
                              </option>
                            ))}
                          </select>
                          {errors.department && (
                            <p className="text-red-500 text-xs">{errors.department.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="qualification" className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4 text-gray-500" />
                            Qualification *
                          </Label>
                          <Input
                            id="qualification"
                            placeholder="MBBS, MD"
                            {...register("qualification", { required: "Qualification is required" })}
                            className={errors.qualification ? "border-red-500" : ""}
                          />
                          {errors.qualification && (
                            <p className="text-red-500 text-xs">{errors.qualification.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="experience" className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4 text-gray-500" />
                            Experience (Years) *
                          </Label>
                          <Input
                            id="experience"
                            type="number"
                            min="0"
                            {...register("experience", { required: "Experience is required" })}
                            className={errors.experience ? "border-red-500" : ""}
                          />
                          {errors.experience && (
                            <p className="text-red-500 text-xs">{errors.experience.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="specialization">Specialization</Label>
                          <Input
                            id="specialization"
                            placeholder="e.g., Cardiac Surgery"
                            {...register("specialization")}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                      <ShiftManagement shifts={shifts} onChange={setShifts} />

                      <Card className="border-0 bg-white shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <ReceiptText className="w-5 h-5 text-emerald-600" />
                            Consultation Fee
                          </CardTitle>
                          <CardDescription>
                            Amount charged for one consultation session.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                            <Label className="text-sm font-bold text-slate-700">
                              Charge per session
                            </Label>
                            <div className="mt-3 flex h-14 items-center rounded-xl border border-emerald-200 bg-white px-4 shadow-sm">
                              <span className="mr-3 text-lg font-extrabold text-emerald-700">NPR</span>
                              <span className="text-lg font-extrabold text-slate-900">
                                {Number.isFinite(consultationFee) ? consultationFee.toLocaleString("en-US") : "0"}
                              </span>
                            </div>
                            <p className="mt-2 text-xs font-semibold text-slate-500">
                              Consultation fee is managed by admin.
                            </p>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                              This fee is eligible for 5 days. If the patient returns within 5 days for the same visit follow-up, no new fee is charged.
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                              Billing rule
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              From the 6th day, a new consultation fee applies.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {error.message || "Error updating profile"}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={profileSaving}
                        className="flex-1 gap-2 bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                      >
                        {profileSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Update Profile
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/doctor/profile")}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateProfile;
