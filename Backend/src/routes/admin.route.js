import {
    registeradmin,
    loginadmin,
    verifyLoginMfa,
    logoutadmin,
    accesstokenrenewal,
    getprofiledetails,
    updateprofile,
    updateprofilepic,
    getCurrentAdmin,
} from "../controllers/admin.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { requireRole, verifyAuth } from "../middlewares/auth.middleware.js";
import { verifyMfaToken } from "../middlewares/mfa.middleware.js";
import { verifyCaptcha } from "../middlewares/captcha.middleware.js";
import {
    getallappointmentforadmin,
    getappointment,
    gettodayappointment,
} from "../controllers/appointment.controller.js";
import {
    createDoctorByAdmin,
    deleteDoctorByAdmin,
    getalldoctorprofiledetails,
    getdoctorbydept,
    getdoctorprofiledetails,
    updateDoctorByAdmin,
} from "../controllers/doctor.controller.js";
import {
    createDepartment,
    getAllDepartments,
    updateDepartment,
} from "../controllers/department.controller.js";

const router = Router();

// Auth — public
router.post(
    "/register",
    upload.fields([
        { name: "citizenshipdocument", maxCount: 1 },
        { name: "adminId", maxCount: 1 },
        { name: "profilepicture", maxCount: 1 },
        { name: "appointmentletter", maxCount: 1 },
    ]),
    registeradmin
);
router.post("/login", loginadmin);
router.post("/login/verify-mfa", verifyMfaToken, verifyLoginMfa);
router.post("/renew-access-token", accesstokenrenewal);

const adminOnly = [verifyAuth, requireRole("admin")];

// Profile
router.post("/logout", adminOnly, logoutadmin);
router.patch("/update-profile", adminOnly, updateprofile);
router.patch("/update-profilepicture", adminOnly, upload.single("profilepicture"), updateprofilepic);
router.get("/get-profile", adminOnly, getprofiledetails);
router.get("/get-admin", adminOnly, getCurrentAdmin);

// Appointments
router.get("/todayappointments", adminOnly, gettodayappointment);
router.get("/appointments", adminOnly, getallappointmentforadmin);
router.get("/appointments/:appointmentid", adminOnly, getappointment);

// Doctor management
router.get("/doctors", adminOnly, getalldoctorprofiledetails);
router.post(
    "/doctors",
    adminOnly,
    upload.fields([
        { name: "citizenshipdocument", maxCount: 1 },
        { name: "medicaldegree", maxCount: 1 },
        { name: "profilepicture", maxCount: 1 },
        { name: "medicallicense", maxCount: 1 },
    ]),
    createDoctorByAdmin
);
router.get("/doctors/:doctorid", adminOnly, getdoctorprofiledetails);
router.patch(
    "/doctors/:doctorid",
    adminOnly,
    upload.fields([
        { name: "citizenshipdocument", maxCount: 1 },
        { name: "medicaldegree", maxCount: 1 },
        { name: "profilepicture", maxCount: 1 },
        { name: "medicallicense", maxCount: 1 },
    ]),
    updateDoctorByAdmin
);
router.delete("/doctors/:doctorid", adminOnly, deleteDoctorByAdmin);
router.get("/departments/:deptname/doctors", adminOnly, getdoctorbydept);

// Departments
router.post("/create-department", adminOnly, createDepartment);
router.get("/departments", adminOnly, getAllDepartments);
router.patch("/update-department/:id", adminOnly, updateDepartment);

export default router;
