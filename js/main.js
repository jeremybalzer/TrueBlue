$(document).ready(function() {
    var hourInput = $('.12-hour');
    console.log(hourInput);
    $.each(hourInput, function(index, value) {
        console.log(value);
        for (i = 1; i < 13; i++) {
            for (j = 0; j < 4; j++) {
                var minutes = j * 15;
                if (minutes == 0) {
                    minutes = "00";
                }
                var time = i + ":" + minutes;
                console.log(time);
                $(value).append("<option value='" + time + "'>" + time + "</option>");
            }
        }
    });

    $('.accordion-toggle').on('click', function(e) {
        e.preventDefault();
        $(this).find('.arrow').toggleClass('down').toggleClass('up');
        // $(this).siblings('.accordion-body').toggleClass('open');
        $(this).siblings('.accordion-body').slideToggle(250);

    });

    $('.padlock').on('click', function(e) {
        e.preventDefault();
        $(this).closest('section').toggleClass('locked').toggleClass('unlocked');
    });

    $('.datepicker').pikaday();
    $('select').dropkick();

});