import { HelpCircle, Phone, Mail, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { 
    q: "What are the hospital's visiting hours?", 
    a: "Visiting hours are from 9:00 AM to 7:00 PM every day. For ICU patients, special visiting hours apply from 11:00 AM to 12:00 PM and 4:00 PM to 5:00 PM. Please check with the nursing station for specific ward timings." 
  },
  { 
    q: "How can I make an appointment?", 
    a: "You can book appointments online, through our mobile app, by calling our 24/7 helpline at +977-1-4566742, or by visiting our reception desk in Sinamangal, Kathmandu. Online booking is available for all departments and specialists." 
  },
  { 
    q: "What insurance do you accept?", 
    a: "We support claims and documentation for Nepal Health Insurance Board, Social Security Fund, and selected Nepali private insurers such as Shikhar Insurance, Neco Insurance, Siddhartha Premier Insurance, and Sagarmatha Lumbini Insurance. Please contact our insurance desk for plan verification." 
  },
  { 
    q: "Do you have emergency services?", 
    a: "Yes, our fully-equipped emergency department operates 24/7 with trained emergency physicians, nurses, and support staff. We handle all types of medical emergencies with immediate care and advanced life support systems." 
  },
  { 
    q: "What documents do I need for admission?", 
    a: "For admission, please bring a valid Nepali photo ID such as your National ID, citizenship certificate, PAN card, passport, or driving license, plus your insurance card if applicable, previous medical records, referral letter, and relevant test reports. Our admission desk will guide you through the process." 
  },
  { 
    q: "Do you offer online consultation services?", 
    a: "Yes, we provide teleconsultation services for non-emergency cases. You can book video consultations with our doctors through our website or mobile app. This service is available for follow-ups, prescription renewals, and general health queries." 
  },
];

export default function FAQs() {
  return (
    <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4">
            <Badge 
              variant="secondary" 
              className="bg-emerald-50/80 text-emerald-700 border border-emerald-100/50 px-4 py-1.5"
            >
              <HelpCircle className="w-3 h-3 mr-1.5" />
              FAQ
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Find answers to common questions about our services, facilities, and procedures. 
              Can't find what you're looking for? Contact our support team.
            </p>
          </div>

          {/* FAQ Accordion with Glass Effect */}
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-gray-100 rounded-2xl px-8 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 data-[state=open]:shadow-lg data-[state=open]:border-emerald-100"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6 text-base font-semibold text-gray-900">
                  <span className="pr-4">
                    {faq.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pb-6 text-base">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Glass Contact CTA */}
          <div className="mt-16 p-10 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-xl rounded-3xl text-center border border-emerald-100/50 shadow-lg">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <MessageCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Still have questions?
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
              Our support team is here to help you 24/7 with any concerns
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                className="bg-[#02B833] hover:bg-[#029E2C] text-white rounded-full px-8 shadow-lg shadow-[#02B833]/25 transition-all hover:shadow-xl"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Us Now
              </Button>
              <Button 
                variant="outline" 
                className="rounded-full px-8 bg-white text-black border border-black hover:bg-gray-50 transition-all"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
