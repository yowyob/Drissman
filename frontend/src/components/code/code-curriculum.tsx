import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2 } from "lucide-react";

const MODULES = [
    {
        id: "m1",
        title: "Thème 1 : La Circulation Routière",
        topics: ["Signalisation verticale", "Signalisation horizontale", "Les intersections et priorités", "Circulation"]
    },
    {
        id: "m2",
        title: "Thème 2 : Le Conducteur",
        topics: ["Temps de réaction", "Alcool et stupéfiants", "Fatigue et vigilance", "Documents obligatoires"]
    },
    {
        id: "m3",
        title: "Thème 3 : La Route",
        topics: ["Les conditions difficiles", "Autoroute et voies rapides", "Les zones dangereuses", "Eco-conduite"]
    },
    {
        id: "m4",
        title: "Thème 4 : Les Autres Usagers",
        topics: ["Piétons et cyclistes", "Motos et deux-roues", "Véhicules lourds", "Transports en commun"]
    },
    {
        id: "m5",
        title: "Thème 5 : Réglementation Générale",
        topics: ["Permis à points", "Infractions et sanctions", "Assurance et accidents", "Premiers secours"]
    }
];

export function CodeCurriculum() {
    return (
        <div className="w-full bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <Accordion type="single" collapsible className="w-full">
                {MODULES.map((module) => (
                    <AccordionItem key={module.id} value={module.id} className="border-white/10">
                        <AccordionTrigger className="text-left font-semibold text-snow hover:no-underline hover:bg-white/5 px-4 rounded-lg transition-colors">
                            {module.title}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pt-2">
                            <ul className="space-y-3">
                                {module.topics.map((topic, i) => (
                                    <li key={i} className="flex items-center gap-3 text-mist">
                                        <CheckCircle2 className="h-4 w-4 text-signal shrink-0" />
                                        {topic}
                                    </li>
                                ))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
