import logo from "../../../assets/logo.png";
import darkLogo from "../../../assets/darklogo.png";

const DoctorBrand = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="SmartFit"
        className={`${compact ? "h-9" : "h-12"} w-auto object-contain dark:hidden`}
      />
      <img
        src={darkLogo}
        alt="SmartFit"
        className={`${compact ? "h-9" : "h-12"} hidden w-auto object-contain dark:block`}
      />
    </div>
  );
};

export default DoctorBrand;
