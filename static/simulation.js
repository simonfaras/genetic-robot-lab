"use strict";
(function(global) {
    // const { GenLab: { World }} = global;

    const globalSettings = {
        populationSize: 100,
        maxGeneration: 1000,
        mutationChance: 0.1,
        topFitnessShare: 0.3,
    }

    // Population sköter generationer med hjälp av urval, crossover och muteringar
    function population(fitness, crossover, mutate, mutationChance = globalSettings.mutationChance) {
        let generationNumber = 0;

        const sort = (chromosomes) => {
            const sortedChromosomes = chromosomes.slice(0);
            sortedChromosomes.sort((a, b) => a.fitness - b.fitness);

            return sortedChromosomes;
        }

        const calcFitness = (chromosomes) => {
            return chromosomes.map(chromosome => ({
                chromosome,
                fitness: fitness(chromosome)
            }));
        }

        // Kör denna efter en simulation och 
        const getNewGeneration = (currentGeneration) => {
            // Lägg till fitness på alla kromosomer
            const rankedGeneration = calcFitness(currentGeneration);
            // Sortera på fitness och ta ut själva kromosomen
            const sortedGeneration = sort(rankedGeneration).map(item => item.chromosome);

            let crossoverCandidateCount = Math.floor(sortedGeneration.length * globalSettings.topFitnessShare);

            const crossoverCandidates = sortedGeneration.slice(0, crossoverCandidateCount);
            const crossovers = crossoverCandidates.map((chromosome, i, arr) => {
                // Gör crossover mot sista elementet om detta är det första
                const second = i !== 0 ? arr[i - 1] : arr[arr.length - 1];
                
                return crossover(chromosome, second);
            })

            generationNumber++;

            const newGeneration = [
                ...crossoverCandidates,
                ...crossovers,
                // Fyll ut till förra generationens storlek genom att ta med de som blir över
                ...sortedGeneration.slice(crossoverCandidateCount, currentGeneration.length - crossovers.length)
            ];

            // Return new generation with mutations
            return newGeneration.map(chromosome => {
                if (Math.random() <= globalSettings.mutationChance) {
                    return mutate(chromosome);
                }

                return chromosome;
            })
        }

        return {
            getGenerationNumber: () => generationNumber,
            getNewGeneration
        }
    }

    // Denna beror på vilken typ av grejjer vi har
    const simulationSettings = goal => ({
        fitness: function (word) {
            let total = 0;
            for(let i = 0; i < word.length; i++) {
                const score = word.charCodeAt(i) - goal.charCodeAt(i);
                total += score * score;
            }

            return total;
        },
        crossover: (first, second) => {
            const pivot = Math.round(first.length / 2) - 1;

            return first.substr(0, pivot) + second.substr(pivot);
        },
        mutate: word => {
            const index = Math.floor(Math.random() * word.length);
            const change = Math.random() > 0.5 ? 1 : -1;
            const codeAsCharCodes = [...word].map(char => char.charCodeAt(0));
            let mutatedCharCode = codeAsCharCodes[index] + change;

            if (mutatedCharCode < 0) {
                mutatedCharCode = 255;
            }

            if (mutatedCharCode > 255) {
                mutatedCharCode = 0;
            }

            return String.fromCharCode(...[
                ...codeAsCharCodes.slice(0, index),
                mutatedCharCode,
                ...codeAsCharCodes.slice(index + 1)
            ]);
        },
        isCompleted: generation => {
            return generation[0] === goal;
        },
        createChromosome: () => {
            let word = ''

            for (let i = 0; i < goal.length; i++) {
                word += String.fromCharCode(Math.floor(Math.random() * 255));
            }

            return word;
        }
    });

    function runSimulation(settings) {
        let currentGeneration = [];
        for (let i = 0; i < globalSettings.populationSize; i++) {
            currentGeneration.push(settings.createChromosome(settings));
        }

        const pop = population(
            settings.fitness,
            settings.crossover,
            settings.mutate
        )

        for (let i = 0; i < globalSettings.maxGeneration; i++) {
            currentGeneration = pop.getNewGeneration(currentGeneration);

            if (settings.isCompleted(currentGeneration)) {
                break;
            }
        }

        displayResult(pop, currentGeneration);
    }

    function displayResult(pop, generation) {
        console.log(`Simulation ended at generation ${pop.getGenerationNumber()} with best chromosome ${generation[0]}`);
    }

    runSimulation(simulationSettings("bajs"));

})(window);