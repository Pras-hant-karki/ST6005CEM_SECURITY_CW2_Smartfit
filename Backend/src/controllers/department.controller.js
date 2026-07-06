import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import {Department }from "../models/dept.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const createDepartment = asyncHandler(async (req, res, next) => {
    const { deptname, description, iconKey, color } = req.body;
    if (!deptname || !description) {
        throw new apiError(400, "Department name and description are required");
    }
    const normalizedDeptname = deptname.trim().toLowerCase();
    const existingDepartment = await Department.findOne({ deptname: normalizedDeptname });
    if (existingDepartment) {
        throw new apiError(409, "Department with the same name already exists");
    }
    const inferredIconKey = normalizedDeptname.includes("ob/gyn") ||
        normalizedDeptname.includes("obgyn") ||
        normalizedDeptname.includes("obstetric") ||
        normalizedDeptname.includes("gyne")
        ? "obgyn"
        : "hospital";
    const inferredColor = inferredIconKey === "obgyn" ? "obgyn-pink" : "general-green";

    const department = await Department.create({
        deptname: normalizedDeptname,
        description,
        iconKey: iconKey || inferredIconKey,
        color: color || inferredColor,
    });
    if(!department){
        throw new apiError(500, "Department creation failed");
    }
    return res.status(201).json(new apiResponse(200, department,"Department created successfully"));

})

const  updateDepartment = asyncHandler(async (req, res, next) => {
    const { deptname, description, iconKey, color } = req.body;
    const { id } = req.params;
    if (!deptname && !description && !iconKey && !color) {
        throw new apiError(400, "At least one field is required for update");
    }
    
    const department = await Department.findById(id);
    if (!department) {
        throw new apiError(404, "Department not found");
    }
    if (deptname) department.deptname = deptname.trim().toLowerCase();
    if (description) department.description = description;
    if (iconKey) department.iconKey = iconKey;
    if (color) department.color = color;

    await department.save();
    return res.status(200).json(new apiResponse(200, department,"Department updated successfully"));
})

const getAllDepartments = asyncHandler(async (req, res, next) => {
    const departments = await Department.find();
    return res.status(200).json(new apiResponse(200, departments,"Departments retrieved successfully"));
})
export { createDepartment,updateDepartment,getAllDepartments };
