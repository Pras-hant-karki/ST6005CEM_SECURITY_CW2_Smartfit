import zxcvbn from "zxcvbn";

const LABELS = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-green-400", "bg-green-600"];
const TEXT_COLORS = ["text-red-600", "text-orange-600", "text-yellow-600", "text-green-600", "text-green-700"];

export default function PasswordStrengthMeter({ password }) {
    if (!password) return null;
    const { score } = zxcvbn(password);
    return (
        <div className="space-y-1 mt-1">
            <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${i <= score ? COLORS[score] : "bg-gray-200"}`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${TEXT_COLORS[score]}`}>{LABELS[score]}</p>
        </div>
    );
}
