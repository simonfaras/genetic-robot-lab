"use strict";

(function(global) {
    const { GenLab: { World }} = global;

    const globalSettings = {
        populationSize: 20,
        maxGeneration: 50,
        maxGenerationsWithoutImprovements: 50,
        mutationChance: 0.1,
        topFitnessShare: 0.3,
    }

    // Run until done thing
    const runner = (data, doWork, isDone) => {
        return new Promise(resolve => {
            doWork(data).then(result => {
                if (!isDone(result)) {
                    runner(result, doWork, isDone).then(r => resolve(r))
                } else {
                    resolve(result);
                }
            })
        });
    }

    // Population sköter generationer med hjälp av urval, crossover och muteringar
    function population(fitness, crossover, mutate, isBetter, mutationChance = globalSettings.mutationChance) {
        let generationNumber = 0;

        const sort = individuals => {
            const sortedIndividuals = individuals.slice(0);
            sortedIndividuals.sort((a, b) => {
                if (a > b) {
                    return 1;
                }
                if (b > a) {
                    return -1;
                }
                return 0;
            });
            return sortedIndividuals;
        }

        const mutateIndividuals = individuals => individuals.map(individ => {
                if (Math.random() <= globalSettings.mutationChance) {
                    return mutate(individ);
                }

                return individ;
        });

        const calcFitness = individuals => {
            return individuals.map(individual => ({
                individual,
                fitness: fitness(individual)
            }));
        }

        // Kör denna efter en simulation och 
        const getNewGeneration = (currentGeneration) => {
            // Lägg till fitness på alla kromosomer
            const rankedGeneration = calcFitness(currentGeneration);
            // Sortera på fitness och ta ut själva kromosomen
            const sortedGeneration = sort(rankedGeneration).map(item => item.individual);

            let crossoverCandidateCount = Math.floor(sortedGeneration.length * globalSettings.topFitnessShare);

            const crossoverCandidates = sortedGeneration.slice(0, crossoverCandidateCount);
            const crossovers = crossoverCandidates.map((chromosome, i, arr) => {
                // Gör crossover mot sista elementet om detta är det första
                const second = i !== 0 ? arr[i - 1] : arr[arr.length - 1];
                
                return crossover(chromosome, second);
            })

            generationNumber++;

            const newGeneration = mutateIndividuals([
                ...crossoverCandidates,
                ...crossovers,
                // Fyll ut till förra generationens storlek genom att ta med de som blir över
                ...sortedGeneration.slice(crossoverCandidateCount, currentGeneration.length - crossovers.length)
            ]);

            return newGeneration;
        }


        return {
            getGenerationNumber: () => generationNumber,
            getNewGeneration,
            getTopIndividual: individuals => {
                return sort(calcFitness(individuals))[0];
            }
        }
    }

    

    function runSimulation(settings) {
        
        const pop = population(
            settings.calcFitness,
            settings.crossover,
            settings.mutate,
            settings.isBetter
        );
        
        // Skicka alltid in en generation bara

        let globalHigh = {
            generation: 0,
            fitness: settings.initialHigh,
            individual: null
        };

        const simulateGeneration = generation => new Promise(resolve => {
            GenLab.World.run(generation).then(result => {
                const { individual, fitness } = pop.getTopIndividual(result);
                const currentGenerationNumber = pop.getGenerationNumber();

                // Check if we found a new global high
                if (settings.isBetter(fitness, globalHigh.fitness)) {
                    globalHigh = {
                        fitness,
                        individual,
                        generation: currentGenerationNumber,
                    };
                }

                //f (currentGenerationNumber >= 3 && currentGenerationNumber % 3 === 0) {
                    console.log(`Top individual at generation ${currentGenerationNumber}: ${globalHigh.individual.jumpDistance}`);
                //}

                resolve(pop.getNewGeneration(result));
            });
            
        });

        const shouldStopEvolve = generation => {
            const {individual, fitness} = pop.getTopIndividual(generation);

            if (settings.isPerfect(individual)) {
                return true;
            }

            const generationNumber = pop.getGenerationNumber();

            // Stop evolve if no improvements are made
            return (generationNumber === globalSettings.maxGeneration) || (generationNumber - globalHigh.generation > globalSettings.maxGenerationsWithoutImprovements);
        }

        let currentGeneration = settings.getInitialGeneration();
        runner(currentGeneration, simulateGeneration, shouldStopEvolve)
            .then(result => {
                const currentGenerationNumber = pop.getGenerationNumber();
                let topGeneration = currentGenerationNumber;
                
                let { individual, fitness: resultFitness } = pop.getTopIndividual(result);
                

                console.log('Ending at generation', currentGenerationNumber);
                if (settings.isBetter(globalHigh.fitness, resultFitness)) {
                    topGeneration = globalHigh.generation;
                    individual = globalHigh.individual;
                }
                        
                console.log('Top individual', individual, 'from generation', topGeneration);
            });
    }

    function getRandomInclusive(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    const robotEvolveSettings = (goal, {minTiming, maxTiming}) => ({
        calcFitness: robot => robot.jumpDistance,
        crossover: (first, second) => {
            return {
                timing: [first.timing[0], second.timing[1]]
            };
        },
        mutate: robot => {
            const leg = Math.random() > 0.5 ? 1 : 0;
            const change = 200 * (Math.random() > 0.5 ? -1 : 1); 
            const value = robot.timing[leg] = change > 0 ? Math.max(maxTiming, change) : Math.min(minTiming, change);

            return robot;
        },
        getInitialGeneration: () => {
            const initialGeneration = [];

            for (let i = 0; i < globalSettings.populationSize; i++) {
                const leftTiming = getRandomInclusive(minTiming, maxTiming);
                const rightTiming = getRandomInclusive(minTiming, maxTiming);

                initialGeneration.push({
                    timing: [leftTiming, rightTiming],
                    jumpDistance: 0
                });
            }

            return initialGeneration;
        },
        isPerfect: individual => individual.jumpDistance >= goal,
        isBetter: (a, b) => a > b,
        initialHigh: 0
    });

    // Denna beror på vilken typ av grejjer vi har
    const wordEvolveSettings = goal => ({
        calcFitness: function (word) {
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
        getInitialGeneration: () => {
            const initialGeneration = [];

            for (let i = 0; i < globalSettings.populationSize; i++) {
                let word = ''

                for (let j = 0; j < goal.length; j++) {
                    word += String.fromCharCode(Math.floor(Math.random() * 255));
                }

                initialGeneration.push(word);
            }

            return initialGeneration;
        },
        isPerfect: individual => individual === goal,
        isBetter: (a, b) => a > b,  
        initialHigh: 9999
    });
    
    const simulationConstants = {
        maxTiming: 3000,
        minTiming: 0
    }
    //const simulationSettings = wordEvolveSettings("Hej Fredrik");
    const simulationSettings = robotEvolveSettings(500, simulationConstants);

    runSimulation(simulationSettings);
})(window);