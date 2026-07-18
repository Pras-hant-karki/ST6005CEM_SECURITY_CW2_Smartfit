import { Appointment } from "../models/appointment.model.js";
import { Doctor } from "../models/doctor.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import generateOtp from "../utils/otpgenerator.js";
import sendMail from "../services/mail.js";
import {
  appointmentcancellation,
  appointmentconfirmation,
  appointmentupdation,
} from "../utils/emailtemplate.js";
import { logAudit } from "../services/auditLog.service.js";

const formatAppointment = (appointment) => {
  return {
    _id: appointment._id,
    appointmentdate: appointment.appointmentdate,
    appointmenttime: appointment.appointmenttime,
    symptoms: appointment.symptoms,
    medicalhistory: appointment.medicalhistory,
    status: appointment.status,
    uniquecode: appointment.uniquecode,
    patientdetails: appointment.patient,
    doctordetails: appointment.doctor,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
};

const parseTimeToMinutes = (value) => {
  const [hours, minutes] = String(value || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const formatMinutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayWindow = (dateString) => {
  const start = new Date(`${dateString}T00:00:00.000`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const createAppointment = asyncHandler(async (req, res) => {
  const { appointmenttime, appointmentdate, symptoms, medicalhistory } =
    req.body;
  const { doctorid } = req.params;

  if (!req.patient) throw new apiError(401, "Unauthorized");
  if (!appointmenttime || !appointmentdate)
    throw new apiError(400, "Date and time required");

  const doctor = await Doctor.findById(doctorid);
  if (!doctor) throw new apiError(404, "Doctor not found");

  const appointmentDateObj = new Date(appointmentdate);
  if (isNaN(appointmentDateObj.getTime()) || appointmentDateObj <= new Date()) {
    throw new apiError(400, "Appointment date must be a valid future date");
  }
  // rejects the past date booking in present time zone, 
  // but allows future date booking in any time zone

const requestedDay = appointmentDateObj.toLocaleDateString("en-US", { weekday: "long" });
  const dayShifts = doctor.shift.filter((s) => s.day === requestedDay);
  const validSlots = dayShifts.flatMap((s) => {
  const start = parseTimeToMinutes(s.starttime);
  const end = parseTimeToMinutes(s.endtime);
  const interval = Number(s.patientslot) || 30;
  const slots = [];
  for (let m = start; m < end; m += interval) slots.push(formatMinutesToTime(m));
  return slots;
});
if (!validSlots.includes(appointmenttime)) {
  throw new apiError(400, "Doctor is not available at the requested time");
}

  try {
      const created = await Appointment.create({
        patient: req.patient._id,
        doctor: doctor._id,
        appointmentdate: appointmentDateObj,
        appointmenttime,
        symptoms,
        medicalhistory: medicalhistory || "None",
        uniquecode: generateOtp(),
        status: "Confirmed",
      });

    sendMail({
      to: req.patient.email,
      subject: "Appointment Scheduled Successfully",
      html: appointmentconfirmation(
        created.uniquecode,
        req.patient.patientname,
        doctor.doctorname,
        doctor.department,
        created.appointmentdate,
        appointmenttime
      ),
    }).catch(() => {});

    const appointment = await Appointment.findById(created._id)
      .populate("patient", "patientname patientusername age sex phonenumber email")
      .populate(
        "doctor",
        "doctorname doctorusername department specialization qualification consultationfee"
      );

    logAudit({ userId: req.patient._id, userRole: "patient", action: "appointment_created", resource: `appointment/${created._id}`, ip: req.ip, result: "success", metadata: { doctorId: doctor._id, date: appointmentdate } });

    return res
      .status(201)
      .json(new apiResponse(201, formatAppointment(appointment), "Appointment created"));
  } catch (error) {
    if (error.code === 11000)
      throw new apiError(400, "Slot already booked");
    throw error;
  }
});

const checkavailability = asyncHandler(async (req, res) => {
  const { doctorid, month, year } = req.query;

  if (!doctorid || !month || !year) {
    throw new apiError(400, "Doctor id, month, and year are required");
  }

  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (
    Number.isNaN(numericMonth) ||
    Number.isNaN(numericYear) ||
    numericMonth < 1 ||
    numericMonth > 12
  ) {
    throw new apiError(400, "Invalid month or year");
  }

  const doctor = await Doctor.findById(doctorid);
  if (!doctor) throw new apiError(404, "Doctor not found");

  const monthStart = new Date(numericYear, numericMonth - 1, 1);
  const monthEnd = new Date(numericYear, numericMonth, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    doctor: doctor._id,
    appointmentdate: { $gte: monthStart, $lte: monthEnd },
    status: { $ne: "Cancelled" },
  }).select("appointmentdate appointmenttime");

  const bookedByDate = appointments.reduce((acc, appointment) => {
    const key = getLocalDateString(new Date(appointment.appointmentdate));
    if (!acc[key]) acc[key] = new Set();
    acc[key].add(appointment.appointmenttime);
    return acc;
  }, {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availability = [];

  for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const dateString = getLocalDateString(dateOnly);
    const dayName = dateOnly.toLocaleDateString("en-US", { weekday: "long" });

    const dayShifts = doctor.shift.filter((shift) => shift.day === dayName);
    const availableTimes = [];

    if (dateOnly >= today) {
      for (const shift of dayShifts) {
        const start = parseTimeToMinutes(shift.starttime);
        const end = parseTimeToMinutes(shift.endtime);
        const interval = Number(shift.patientslot) || 30;

        if (start === null || end === null || end <= start || interval <= 0) continue;

        for (let current = start; current < end; current += interval) {
          const slot = formatMinutesToTime(current);
          if (!bookedByDate[dateString]?.has(slot)) {
            availableTimes.push(slot);
          }
        }
      }
    }

    availability.push({
      date: dateString,
      isAvailable: availableTimes.length > 0,
      availableTimes,
    });
  }

  return res
    .status(200)
    .json(new apiResponse(200, availability, "Availability fetched successfully"));
});

const cancelappointment = asyncHandler(async (req, res) => {
  const { appointmentid } = req.params;

  const appointment = await Appointment.findById(appointmentid)
    .populate("patient")
    .populate("doctor");

  if (!appointment) throw new apiError(404, "Appointment not found");

  if (
    req.patient &&
    appointment.patient._id.toString() !== req.patient._id.toString()
  )
    throw new apiError(403, "Not allowed");

// fixed — refuse if it's already cancelled or already completed
  if (appointment.status === "Cancelled") throw new apiError(
    400, "Appointment is already cancelled");
  if (appointment.status === "Completed") throw new apiError(
    400, "Cannot modify a completed appointment");

  appointment.status = "Cancelled";
  appointment.deleteafter = new Date(
    Date.now() + 24 * 60 * 60 * 1000);
    await appointment.save();
    // now appointment status saved in real time in database, and will be deleted after 24 hours
  logAudit({ userId: req.patient?._id || req.doctor?._id, userRole: 
    req.patient ? "patient" : "doctor", action: "appointment_cancelled", 
    resource: `appointment/${appointmentid}`, ip: req.ip, result: "success" });

  sendMail({
    to: appointment.patient.email,
    subject: "Appointment Cancelled",
    html: appointmentcancellation(
      appointment.patient.patientname,
      appointment.doctor.doctorname,
      appointment.appointmentdate,
      appointment.appointmenttime
    ),
  }).catch(() => {});

  return res
    .status(200)
    .json(new apiResponse(200, formatAppointment(appointment)));
});

const updateappointment = asyncHandler(async (req, res) => {
  const { appointmentid } = req.params;
  const { appointmenttime, appointmentdate, symptoms, medicalhistory } =
    req.body;

  const appointment = await Appointment.findById(appointmentid);
  if (!appointment) throw new apiError(404, "Appointment not found");

  if (appointment.status === "Cancelled") throw new apiError(400, "Cannot modify a cancelled appointment");
  if (appointment.status === "Completed") throw new apiError(400, "Cannot modify a completed appointment");


  if (
    req.patient &&
    appointment.patient.toString() !== req.patient._id.toString()
  ) {
    throw new apiError(403, "Not allowed");
  }

  const requestedDateString = appointmentdate || getLocalDateString(new Date(appointment.appointmentdate));
  const requestedTime = appointmenttime || appointment.appointmenttime;
  const { start, end } = getDayWindow(requestedDateString);
  const duplicate = await Appointment.findOne({
    _id: { $ne: appointment._id },
    doctor: appointment.doctor,
    appointmentdate: { $gte: start, $lt: end },
    appointmenttime: requestedTime,
    status: { $ne: "Cancelled" },
  });

  if (duplicate) throw new apiError(400, "Slot already booked");

  appointment.appointmenttime = requestedTime;
  appointment.appointmentdate = new Date(requestedDateString);
  if (symptoms !== undefined) appointment.symptoms = symptoms;
  appointment.medicalhistory = medicalhistory || "None";

  try {
    await appointment.save();
  } catch (error) {
    if (error.code === 11000)
      throw new apiError(400, "Slot already booked");
    throw error;
  }

  logAudit({ userId: req.patient?._id, userRole: "patient", action: "appointment_updated", resource: `appointment/${appointmentid}`, 
    ip: req.ip, result: "success" });

  const updatedAppointment = await Appointment.findById(appointment._id)
    .populate("patient", "patientname patientusername age sex phonenumber email")
    .populate("doctor", "doctorname doctorusername department specialization qualification consultationfee");
    // skipped the populate-and-format step used by every other appointment endpoint

  sendMail({
    to: updatedAppointment.patient.email,
    subject: "Your SmartFit Appointment Has Been Updated",
    html: appointmentupdation(
      updatedAppointment.patient.patientname,
      updatedAppointment.doctor.doctorname,
      updatedAppointment.appointmentdate,
      updatedAppointment.appointmenttime
    ),
  }).catch(() => {});

  return res
    .status(200)
    .json(new apiResponse(200, formatAppointment(updatedAppointment))); 
    // bare ObjectId strings are returned now instead of nested user objects and no more exposing the internal __v field.
});


const getappointment = asyncHandler(async (req, res) => {
  const { appointmentid } = req.params;

  const appointment = await Appointment.findById(appointmentid)
    .populate("patient", "patientname patientusername age sex phonenumber email")
    .populate(
      "doctor",
      "doctorname doctorusername department specialization qualification consultationfee"
    );

  if (!appointment) throw new apiError(404, "Not found");
  if (req.patient && appointment.patient._id.toString() !== req.patient._id.toString())
    throw new apiError(403, "Access denied");
  if (req.doctor && appointment.doctor._id.toString() !== req.doctor._id.toString())
    throw new apiError(403, "Access denied");

  return res
    .status(200)
    .json(new apiResponse(200, formatAppointment(appointment)));
});

const getallappointmentforpatient = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({
    patient: req.patient._id,
  })
    .populate(
      "doctor",
      "doctorname doctorusername department specialization qualification consultationfee"
    )
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new apiResponse(
      200,
      appointments.map(formatAppointment)
    )
  );
});

const getallappointmentfordoctor = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({
    doctor: req.doctor._id,
  })
    .populate(
      "patient",
      "patientname patientusername age sex phonenumber email"
    )
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new apiResponse(
      200,
      appointments.map(formatAppointment)
    )
  );
});

const gettodayappointment = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const filter = {
    appointmentdate: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
  };

  if (req.doctor) {
    filter.doctor = req.doctor._id;
  }

  const appointments = await Appointment.find(filter)
    .populate(
      "patient",
      "patientname patientusername age sex phonenumber email"
    )
    .populate(
      "doctor",
      "doctorname doctorusername department specialization qualification consultationfee"
    )
    .sort({ appointmenttime: 1, createdAt: -1 });

  return res.status(200).json(
    new apiResponse(
      200,
      appointments.map(formatAppointment)
    )
  );
});

const verifyappointment = asyncHandler(async (req, res) => {
  const appointmentid = req.body.appointmentid || req.params.appointmentid;
  const uniquecode = req.body.uniquecode || req.body.code;

  if (!req.doctor) throw new apiError(403, "Only doctors can verify appointments");
  if (!appointmentid || !uniquecode)
    throw new apiError(400, "Appointment id and unique code are required");

  const appointment = await Appointment.findOne({
    _id: appointmentid,
    doctor: req.doctor._id,
  })
    .populate("patient", "patientname patientusername age sex phonenumber email")
    .populate(
      "doctor",
      "doctorname doctorusername department specialization qualification consultationfee"
    );

  if (!appointment) throw new apiError(404, "Appointment not found");
  if (appointment.uniquecode !== uniquecode)
    throw new apiError(400, "Invalid appointment code");
  if (appointment.status === "Cancelled")
    throw new apiError(400, "Cancelled appointment cannot be verified");

  appointment.status = "Completed";
  await appointment.save();

  return res
    .status(200)
    .json(new apiResponse(200, formatAppointment(appointment), "Appointment verified"));
});

const getallappointmentforadmin = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find()
    .populate(
      "patient",
      "patientname patientusername age sex phonenumber"
    )
    .populate(
      "doctor",
      "doctorname doctorusername department specialization qualification consultationfee"
    )
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new apiResponse(
      200,
      appointments.map(formatAppointment)
    )
  );
});

export {
  createAppointment,
  cancelappointment,
  updateappointment,
  getappointment,
  getallappointmentforpatient,
  getallappointmentfordoctor,
  gettodayappointment,
  verifyappointment,
  getallappointmentforadmin,
  checkavailability,
};
