import { ArrowLeft, Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ComingSoon({ icon: Icon = Clock3, title, description }) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#eafff0] py-20 px-4">
      <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -left-20 w-[400px] h-[400px] bg-teal-100/30 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto max-w-xl text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg shadow-[#02B833]/15">
          <Icon className="h-9 w-9 text-[#02B833]" strokeWidth={1.5} />
        </div>

        <Badge variant="secondary" className="bg-emerald-50/90 text-emerald-700 border border-emerald-200/50 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
          Coming Soon
        </Badge>

        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-gray-600 leading-relaxed">{description}</p>

        <div className="pt-4">
          <Button
            onClick={() => navigate("/")}
            className="bg-[#02B833] hover:bg-[#029E2C] text-white rounded-full px-8 h-12 font-semibold shadow-lg shadow-[#02B833]/25 transition-all hover:shadow-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
