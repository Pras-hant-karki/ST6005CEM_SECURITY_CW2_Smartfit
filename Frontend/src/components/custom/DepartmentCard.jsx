import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Stethoscope } from "lucide-react";

const departmentIcons = {
  cardiology: "HE",
  neurology: "NE",
  orthopedics: "OR",
  pediatrics: "PE",
  dermatology: "DE",
  oncology: "ON",
  general: "GM",
  emergency: "ER",
  surgery: "SU",
};

function DepartmentCard({ name, description, onClick }) {
  const icon = departmentIcons[name?.toLowerCase()] || "MD";

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 bg-white h-full"
    >
      <CardContent className="p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative space-y-4">
          <div className="flex items-start justify-between">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-300" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900 capitalize group-hover:text-emerald-600 transition-colors duration-300">
              {name}
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {description || "Explore our specialized doctors in this department with expert care."}
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <Badge variant="secondary" className="text-xs gap-1 bg-emerald-50 text-emerald-700">
              <Stethoscope className="w-3 h-3" />
              View Specialists
            </Badge>
          </div>
        </div>

        <div className="absolute inset-0 border-2 border-emerald-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </CardContent>
    </Card>
  );
}

export default DepartmentCard;
