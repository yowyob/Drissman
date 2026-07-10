"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ChevronRight, RotateCcw } from "lucide-react";

interface Question {
    id: number;
    question: string;
    options: { id: string; text: string; correct: boolean }[];
    explanation: string;
    theme: string;
}

const QUIZ_QUESTIONS: Question[] = [
    {
        id: 1,
        question: "Quelle est la vitesse maximale autorisée en agglomération au Cameroun ?",
        options: [
            { id: "a", text: "40 km/h", correct: false },
            { id: "b", text: "60 km/h", correct: true },
            { id: "c", text: "50 km/h", correct: false },
            { id: "d", text: "80 km/h", correct: false },
        ],
        explanation: "En ville, la vitesse est limitée à 60 km/h sauf indication contraire.",
        theme: "Vitesse"
    },
    {
        id: 2,
        question: "Quelle est la distance de sécurité minimale à respecter sur autoroute ?",
        options: [
            { id: "a", text: "50 mètres", correct: false },
            { id: "b", text: "100 mètres", correct: true },
            { id: "c", text: "30 mètres", correct: false },
            { id: "d", text: "150 mètres", correct: false },
        ],
        explanation: "Sur autoroute, maintenez au moins 100 mètres de distance (2 secondes) avec le véhicule qui précède.",
        theme: "Sécurité"
    },
    {
        id: 3,
        question: "Que signifie un panneau triangulaire à bord rouge ?",
        options: [
            { id: "a", text: "Obligation", correct: false },
            { id: "b", text: "Interdiction", correct: false },
            { id: "c", text: "Danger", correct: true },
            { id: "d", text: "Information", correct: false },
        ],
        explanation: "Les panneaux triangulaires à bord rouge sont des panneaux de danger qui avertissent d'un risque.",
        theme: "Signalisation"
    },
    {
        id: 4,
        question: "Quel est le taux d'alcoolémie maximal autorisé pour un conducteur novice ?",
        options: [
            { id: "a", text: "0,5 g/l", correct: false },
            { id: "b", text: "0,2 g/l", correct: true },
            { id: "c", text: "0,8 g/l", correct: false },
            { id: "d", text: "0 g/l", correct: false },
        ],
        explanation: "Pour les conducteurs novices, le taux maximal est de 0,2 g/l de sang.",
        theme: "Alcool"
    },
    {
        id: 5,
        question: "Dans un rond-point, qui a la priorité ?",
        options: [
            { id: "a", text: "Les véhicules qui entrent", correct: false },
            { id: "b", text: "Les véhicules qui sont déjà dans le rond-point", correct: true },
            { id: "c", text: "Les véhicules venant de droite", correct: false },
            { id: "d", text: "Personne", correct: false },
        ],
        explanation: "Les véhicules circulant dans le rond-point ont la priorité sur ceux qui y entrent.",
        theme: "Priorité"
    },
    {
        id: 6,
        question: "Quand faut-il allumer les feux de croisement ?",
        options: [
            { id: "a", text: "Uniquement la nuit", correct: false },
            { id: "b", text: "En cas de pluie forte", correct: false },
            { id: "c", text: "La nuit et par visibilité réduite", correct: true },
            { id: "d", text: "Jamais en ville", correct: false },
        ],
        explanation: "Les feux de croisement s'utilisent la nuit, par temps de pluie, brouillard ou toute autre condition de visibilité réduite.",
        theme: "Éclairage"
    },
    {
        id: 7,
        question: "Quelle est la signification d'un feu orange clignotant ?",
        options: [
            { id: "a", text: "Arrêt obligatoire", correct: false },
            { id: "b", text: "Passage autorisé avec prudence", correct: true },
            { id: "c", text: "Accélérer pour passer", correct: false },
            { id: "d", text: "Priorité absolue", correct: false },
        ],
        explanation: "Le feu orange clignotant signifie ralentir et passer avec prudence, la priorité n'est pas définie.",
        theme: "Signalisation"
    },
    {
        id: 8,
        question: "À quelle distance d'un passage piéton est-il interdit de stationner ?",
        options: [
            { id: "a", text: "3 mètres", correct: false },
            { id: "b", text: "5 mètres", correct: true },
            { id: "c", text: "10 mètres", correct: false },
            { id: "d", text: "1 mètre", correct: false },
        ],
        explanation: "Il est interdit de stationner à moins de 5 mètres d'un passage piéton.",
        theme: "Stationnement"
    },
    {
        id: 9,
        question: "Que doit faire un conducteur en cas de crevaison sur autoroute ?",
        options: [
            { id: "a", text: "S'arrêter sur la voie de gauche", correct: false },
            { id: "b", text: "Continuer jusqu'à la prochaine sortie", correct: false },
            { id: "c", text: "Se garer sur la bande d'arrêt d'urgence", correct: true },
            { id: "d", text: "Appeler la police immédiatement", correct: false },
        ],
        explanation: "En cas de panne ou crevaison, garez-vous sur la bande d'arrêt d'urgence et activez vos feux de détresse.",
        theme: "Sécurité"
    },
    {
        id: 10,
        question: "Quel document n'est PAS obligatoire à avoir dans le véhicule ?",
        options: [
            { id: "a", text: "Permis de conduire", correct: false },
            { id: "b", text: "Carte grise", correct: false },
            { id: "c", text: "Assurance", correct: false },
            { id: "d", text: "Carnet d'entretien", correct: true },
        ],
        explanation: "Le carnet d'entretien n'est pas obligatoire. En revanche, permis, carte grise et attestation d'assurance le sont.",
        theme: "Documents"
    }
];

export function QuizDemo() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);

    const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
    const correctAnswer = currentQuestion.options.find(o => o.correct)?.id;
    const isCorrect = selected === correctAnswer;

    const handleSubmit = () => {
        if (selected) {
            setHasSubmitted(true);
            if (isCorrect) {
                setScore(prev => prev + 1);
            }
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelected(null);
            setHasSubmitted(false);
        } else {
            setQuizCompleted(true);
        }
    };

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setSelected(null);
        setHasSubmitted(false);
        setScore(0);
        setQuizCompleted(false);
    };

    if (quizCompleted) {
        const percentage = Math.round((score / QUIZ_QUESTIONS.length) * 100);
        return (
            <div className="w-full bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 md:p-8 relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-signal via-signal/50 to-signal" />

                <div className={`text-6xl font-black mb-4 ${percentage >= 70 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {score}/{QUIZ_QUESTIONS.length}
                </div>
                <p className="text-2xl font-bold text-snow mb-2">
                    {percentage >= 70 ? "Excellent !" : percentage >= 50 ? "Pas mal !" : "Il faut réviser !"}
                </p>
                <p className="text-mist mb-6">
                    Vous avez obtenu {percentage}% de bonnes réponses.
                </p>

                <button
                    onClick={handleRestart}
                    className="flex items-center gap-2 mx-auto bg-signal hover:bg-signal-dark text-asphalt font-bold py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all"
                >
                    <RotateCcw className="h-5 w-5" />
                    Recommencer le quiz
                </button>
            </div>
        );
    }

    return (
        <div className="w-full bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-signal via-signal/50 to-signal" />

            <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-mist">
                    Question {currentQuestionIndex + 1}/{QUIZ_QUESTIONS.length}
                </span>
                <span className="text-sm font-bold text-signal bg-signal/10 px-3 py-1 rounded-full border border-signal/20">
                    Thème: {currentQuestion.theme}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
                <div
                    className="h-full bg-signal transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                />
            </div>

            <h3 className="text-xl font-bold text-snow mb-8 leading-relaxed">
                {currentQuestion.question}
            </h3>

            <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => !hasSubmitted && setSelected(option.id)}
                        disabled={hasSubmitted}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center
                            ${hasSubmitted && option.correct
                                ? "border-green-500 bg-green-500/10 text-green-400"
                                : hasSubmitted && selected === option.id && !option.correct
                                    ? "border-red-500 bg-red-500/10 text-red-400"
                                    : selected === option.id
                                        ? "border-signal bg-signal/10 text-snow shadow-[0_0_15px_rgba(255,193,7,0.2)]"
                                        : "border-white/10 hover:border-white/20 hover:bg-white/5 text-mist"
                            }
                        `}
                    >
                        <span className="font-medium">{option.text}</span>
                        {hasSubmitted && option.correct && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {hasSubmitted && selected === option.id && !option.correct && <XCircle className="h-5 w-5 text-red-500" />}
                    </button>
                ))}
            </div>

            {!hasSubmitted ? (
                <button
                    onClick={handleSubmit}
                    className="w-full bg-signal hover:bg-signal-dark text-asphalt font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selected}
                >
                    Valider ma réponse
                </button>
            ) : (
                <div className="space-y-4">
                    <div className={`p-4 rounded-xl text-center ${isCorrect ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                        <p className="font-bold mb-1">
                            {isCorrect ? "Bravo ! Bonne réponse." : "Oups ! Mauvaise réponse."}
                        </p>
                        <p className="text-sm opacity-90">{currentQuestion.explanation}</p>
                    </div>

                    <button
                        onClick={handleNext}
                        className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-snow font-bold py-3 rounded-xl transition-all"
                    >
                        {currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? (
                            <>Question suivante <ChevronRight className="h-5 w-5" /></>
                        ) : (
                            <>Voir mes résultats <ChevronRight className="h-5 w-5" /></>
                        )}
                    </button>
                </div>
            )}

            {/* Score indicator */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <span className="text-xs text-mist">Score actuel: </span>
                <span className="text-sm font-bold text-signal">{score}/{currentQuestionIndex + (hasSubmitted ? 1 : 0)}</span>
            </div>
        </div>
    );
}
