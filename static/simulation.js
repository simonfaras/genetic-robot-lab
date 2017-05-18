function main() {
    let i = 0;
    let completeMember;
    let isComplete = false;
    const population = new Population({
        goal: 'Hello, World!',
        size: 10000
    });

    const display = function(pop) {
        console.log('Generation', pop.generationNumber, "Best individuals", pop.members[0].code, pop.members[1].code);
    }  

    for (let i = 0; i < 1000000; i++) {
        population.generation();
        
        completeMember = population.getCompleteMember();
        if (completeMember) {
            break;
        }

        display(population);
    }

    console.log('Done');
}

function Chromosome(code) {
    if (code) {
        this.code = code;
    }

    this.cost = 9999;
}

Chromosome.prototype = Object.assign({}, {
    code: '',
    random(length) {
        while(length--) {
            this.code += String.fromCharCode(Math.floor(Math.random()*255));
        }
    },
    calcCost(compareTo) {
        let total = 0;
        for(let i = 0; i < this.code.length; i++) {
            const score = this.code.charCodeAt(i) - compareTo.charCodeAt(i);
            total += score * score; // Square score to avoid
        }

        this.cost = total;
    },
    mutate(chance) {
        if (Math.random() > chance) {
            return;
        }

        const index = Math.floor(Math.random() * this.code.length);
        const change = Math.random() > 0.5 ? 1 : -1;
        const codeAsCharCodes = [...this.code].map(char => char.charCodeAt(0));
        let mutatedCharCode = codeAsCharCodes[index] + change;

        if (mutatedCharCode < 0) {
            mutatedCharCode = 255;
        }

        if (mutatedCharCode > 255) {
            mutatedCharCode = 0;
        }

        this.code = String.fromCharCode(...[
            ...codeAsCharCodes.slice(0, index),
            mutatedCharCode,
            ...codeAsCharCodes.slice(index + 1)
        ]);
    },
    crossover(chromosome) {
        const pivot = Math.round(this.code.length / 2) - 1;

        const child1Code = this.code.substr(0, pivot) + chromosome.code.substr(pivot);
        const child2Code = chromosome.code.substr(0, pivot) + this.code.substr(pivot);

        return [
            new Chromosome(child1Code),
            new Chromosome(child2Code)
        ];
    }
});

function Population({goal, size, mutationChance = 0.3}) {
    this.members = [];
    this.goal = goal;
    this.generationNumber = 0;
    this.mutationChance = mutationChance;

    while(size--) {
        const chromsome = new Chromosome();
        chromsome.random(this.goal.length);
        this.members.push(chromsome);
    }
}

Population.prototype = Object.assign({}, {
    sort() {
        this.members.sort((a, b) => a.cost - b.cost);
    },
    generation() {
        // Räkna ut hur "bra" varje individ är
        for (let i = 0; i < this.members.length; i++) {
            this.members[i].calcCost(this.goal);
        }

        this.sort();

        // Kombinera de två bästa
        const [child1, child2] = this.members[0].crossover(this.members[1]);

        // Ersätt de två sämsta individerna med barnen av de två bästa
        this.members.splice(this.members.length - 2, 2, child1, child2);

        // Mutera individer
        for (let i = 0; i < this.members.length; i++) {
            this.members[i].mutate(this.mutationChance);
        }

        this.generationNumber++;
    },
    getCompleteMember() {
        return this.members.find(member => member.code === this.goal);
    }
})

main();