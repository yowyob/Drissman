package com.drissman.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    @GetMapping("/generate")
    public Mono<ResponseEntity<Map<String, Object>>> generateQuiz(
            @RequestParam(defaultValue = "5") int questions,
            @RequestParam(required = false) String context,
            Authentication authentication) {
        
        // Mock generation based on context
        String title = "Quiz: Code de la Route";
        if (context != null && !context.isEmpty()) {
            title += " (" + context + ")";
        }
        
        Map<String, Object> quiz = Map.of(
            "title", title,
            "questions", List.of(
                Map.of(
                    "content", "Que devez-vous faire à un feu orange (jaune fixe) ?",
                    "choices", List.of(
                        Map.of("content", "Accélérer pour passer", "isCorrect", false),
                        Map.of("content", "S'arrêter, sauf danger", "isCorrect", true),
                        Map.of("content", "Klaxonner", "isCorrect", false)
                    ),
                    "explanation", "Le feu jaune fixe indique un arrêt obligatoire, sauf si le conducteur est si près du feu qu'il ne peut s'arrêter en toute sécurité."
                ),
                Map.of(
                    "content", "La ceinture de sécurité est obligatoire :",
                    "choices", List.of(
                        Map.of("content", "Seulement à l'avant", "isCorrect", false),
                        Map.of("content", "Seulement sur autoroute", "isCorrect", false),
                        Map.of("content", "A l'avant comme à l'arrière", "isCorrect", true)
                    ),
                    "explanation", "Le port de la ceinture de sécurité est obligatoire pour tous les passagers, à l'avant et à l'arrière."
                ),
                Map.of(
                    "content", "L'usage du téléphone au volant tenu en main est :",
                    "choices", List.of(
                        Map.of("content", "Autorisé", "isCorrect", false),
                        Map.of("content", "Interdit", "isCorrect", true)
                    ),
                    "explanation", "Conduire avec un téléphone à la main est strictement interdit et dangereux."
                ),
                Map.of(
                    "content", "Le taux d'alcoolémie maximum autorisé pour un jeune conducteur est de :",
                    "choices", List.of(
                        Map.of("content", "0.5 g/L", "isCorrect", false),
                        Map.of("content", "0.2 g/L", "isCorrect", true),
                        Map.of("content", "0.0 g/L", "isCorrect", false)
                    ),
                    "explanation", "Pour les jeunes conducteurs, le taux maximum est de 0.2 g/L, ce qui correspond en pratique à zéro verre."
                ),
                Map.of(
                    "content", "En cas de fatigue sur l'autoroute, il est recommandé de faire une pause :",
                    "choices", List.of(
                        Map.of("content", "Toutes les 2 heures", "isCorrect", true),
                        Map.of("content", "Toutes les 4 heures", "isCorrect", false),
                        Map.of("content", "Seulement si je me sens fatigué", "isCorrect", false)
                    ),
                    "explanation", "Il est fortement recommandé de faire une pause au moins toutes les deux heures."
                )
            )
        );

        Map<String, Object> response = Map.of(
            "success", true,
            "data", quiz
        );

        return Mono.just(ResponseEntity.ok(response));
    }
}
