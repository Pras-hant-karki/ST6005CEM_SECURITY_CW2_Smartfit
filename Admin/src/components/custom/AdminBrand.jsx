import React from "react";

const AdminBrand = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 flex items-center px-3 text-left"
      aria-label="Go to admin dashboard"
    >
      <img
        src="/logo.png"
        alt="SmartFit"
        className="h-11 w-auto object-contain dark:hidden"
      />
      <img
        src="/darklogo.png"
        alt="SmartFit"
        className="hidden h-11 w-auto object-contain dark:block"
      />
    </button>
  );
};

export default AdminBrand;
