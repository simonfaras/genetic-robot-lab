(function() {
    // KÖr function
    // Kolla resultat
    // Kör function igen om resultat inte dög
    const target = 10;

    // Detta ska då motsvara att köra simuleringen

    // DETTA MOTSVARAR XHR
    function runWorld(data, callback) {
        console.log("Run world", data);

        // Waith 500
        setTimeout(() => callback(data + 1), 500);
    }

    const run = (i) => {
        return new Promise(resolve => {
            runWorld(i, result => {
                if (result < target) {
                    run(result).then(r => resolve(r))
                } else {
                    resolve(result);
                }
            })
        });
    }

    run(1)

})();