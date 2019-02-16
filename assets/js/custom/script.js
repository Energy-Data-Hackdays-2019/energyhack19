$(document).ready(function() {

    $("#open-parameters").click(function() {
        $("#parameters-content").slideToggle();
        $("#open-parameters").toggleClass("fa-rotate-180");
    });

    $(".dropdown-item").click(function() {
        $($(".dropdown-toggle", $(this).parents()[1])[0]).html($(this).html());
        calculateBetaValue();
    });

    $("#alpha-input").change(function() {
        selectedAlpha = $("#alpha-input").val();
    });
});


function getValueConverted(val) {
    if(val == "Klein") return 1;
    if(val == "Mittel") return 2;
    if(val == "Gross") return 3;
    return 0;
}

var beta_values = [
  [0.0, 0.1, 0.2, 0.3],
  [0.2, 0.3, 0.4, 0.6],
  [0.4, 0.6, 0.7, 0.8],
  [0.7, 0.8, 0.9, 1.0],
];

var selectedAlpha = 0.5;
var beta = 0.0;

function calculateBetaValue() {
    var verbrauch = $("#verbrauchDropDown").html();
    var batterie = $("#batterieDropDown").html();

    console.log(beta_values[getValueConverted(verbrauch)][getValueConverted(batterie)]);
    beta = (beta_values[getValueConverted(verbrauch)][getValueConverted(batterie)]);

}






//calcPreissignal(12.49, 14.42, 0.5);

function calcPreissignal(htnt, spot, alpha) {
//console.log(alpha*spot+(1-alpha)*htnt);
return alpha*spot+(1-alpha)*htnt;
}

function calcjedeViert(data) {

        //console.log(data.length / 4);

        var compressedToHours = [];
        var i = 0;
        data.forEach(function (kw) {
            var time = kw.time;
            var kw = kw.kw;

            if(i % 4 == 0) {
                compressedToHours.push({timestamp: time, kw: kw});
            } else {
                compressedToHours[compressedToHours.length - 1].kw += kw;
            }
            i++;
        });
        //console.log(compressedToHours);
        return compressedToHours;
}

var preisMitAlpha = [];

$.getJSON("./data/pricecalculate.json", function (dataPrice) {



    var time = 0;
    var kw = 0;
    var kwVerbraucht = []
    var preissignal;
    var faktor = 0.3;
    var normalpris;
    var prisMitFaktor;
    var kwPreisHTNT = [];
    var kwPreisPreissignal = [];
    //console.log(kwVerbraucht);
    //console.log(data);

    $.getJSON("./data/reference.json", function (data) {
        kwVerbraucht = calcjedeViert(data);

        dataPrice.forEach(function (price) {
            var htnt = price.rpkwh;
            var spot = price.brkpwh;
            //console.log(htnt);

            //console.log(faktor * spot + (1-faktor)*htnt)
            preissignal = calcPreissignal(htnt, spot, faktor);

            for(var i = 0; i<kwVerbraucht.length; i++){
                //console.log(price.rpkwh);
                //console.log(kwVerbraucht[i]['kw'] * htnt);
                normalpris = kwVerbraucht[i]['kw'] * htnt;
                prisMitFaktor = kwVerbraucht[i]['kw'] * preissignal;
                //console.log("pris mit htnt bi verbruch vo "+kwVerbraucht[i]['kw']+" chosted: "+ normalpris);
                //console.log("pris mit mit faktor vo "+ faktor + "bi verbruch vo "+kwVerbraucht[i]['kw']+" chosted: "+ prisMitFaktor);
                kwPreisHTNT.push(normalpris);
                kwPreisPreissignal.push(prisMitFaktor);
                preisMitAlpha = kwPreisPreissignal;

            }

        });

    });





});

function calcDays(data){
    var compressedToDays = [];
    var i = 0;


    console.log(data.length);
    data.forEach(function (kw) {

        if(i % 24 == 0) {
            compressedToDays.push(kw);
        } else {
            compressedToDays[compressedToDays.length - 1] += kw;
        }
        i++;
    });
    //console.log(compressedToDays);
    return compressedToDays;
}
calcDelta();
function calcDelta() {

    var arrayTets = [
        15.47,
        14.22,
        13.35,
        12.54,
        12.26,
        13.51,
        16.23,
        18.55,
        19.62,
        19.45,
        18.87,
        18.59,
        17.75,
        17.23,
        16.88,
        16.77,
        17.12,
        18.41,
        20.17,
        20.79,
        19.73,
        18.89,
        18.49,
        16.85
    ]
    var preissignal = 0;
    var standartAbweichung = 0;
    var delta = [];

    $.getJSON("./data/pricecalculate.json", function (dataPrice) {
        dataPrice.forEach(function (price) {
            var htnt = price.rpkwh;
            var spot = price.brkpwh;

        var sum = 0;

        for( var i = 0; i < arrayTets.length; i++ ){
            sum += arrayTets[i]; //don't forget to add the base
        }
        var avg = sum/arrayTets.length;

        preissignal = calcPreissignal(htnt, spot, 0.5);

        delta.push((preissignal - avg)/ stabw(arrayTets)/5);

        });

    });
    console.log(delta);
    return delta;
}


    var stabw = function(arrayS) {
        var len = 0;
        var sum = arrayS.reduce(function(pv, cv) { ++len; return pv + cv; }, 0);
        var mean = sum / len;
        var result = 0;
        for (var i = 0; i < len; i++)
            result += Math.pow(arrayS[i] - mean, 2);
        len = (len == 1) ? len : len - 1;
        return Math.sqrt(result / len);
    }

    function getSpotArray() {
        $.getJSON("./data/pricecalculate.json", function (dataPrice) {
            dataPrice.forEach(function (price) {
                spotArray.push(price.brkpwh);
            });
    });
    }

    function calcOPtimierterLastgang(faktor, delta, referenz) {

    var oLastgang = [];

    for(var i = 0; i< delta.length; i++){
        oLastgang.push((referenz[i]-faktor)*delta[i]);
    }

    return oLastgang
    }