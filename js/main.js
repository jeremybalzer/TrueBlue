var pageData;

$(document).ready(function(){

// ############ Variables ############
    // var pageData, hourInput;

// ############ Page Configuration ############
    
    // Populate the Time Selects
    var hourInput = $('.12-hour');
    $.each(hourInput, function(index, value) {
        for (i = 1; i < 13; i++) {
            for (j = 0; j < 4; j++) {
                var minutes = j * 15;
                if (minutes == 0) {
                    minutes = "00";
                }
                var time = i + ":" + minutes;
                $(value).append("<option value='" + time + "'>" + time + "</option>");
            }
        }
    });

    // Initiate the Datepicker and Select Styling Plugins
    $('.datepicker').pikaday();
    var selectArray = $('.dropkick');
    // var dk0 = $(selectArray[0]).dropkick({
    //     initialize: function(){
    //         this.select(2);
    //     }
    // });
    var dk1 = $(selectArray[1]).dropkick();
    var dk2 = $(selectArray[2]).dropkick();
    var dk3 = $(selectArray[3]).dropkick();
    var dk4 = $(selectArray[4]).dropkick();


    $('#username').val('branch1107@trueblue.com'); 
    $('#password').val('w3Lcome'); 

// ############ Attach Click Handlers ############

    // Login the User using AJAX
    $('#login').on('click', userLogin);

    // Toggle the Locked Sections
    $('.padlock').on('click', function(e){
        e.preventDefault();
        $(this).closest('section').toggleClass('locked').toggleClass('unlocked');
    });

// ############ Functions ############

    // Log in a user
    function userLogin(){
        var user = $('#username').val();
        var pword = $("#password").val();
        
        $.ajax({
            url: "https://wapi.onereach.com/api/login",
            headers:{
                username: user,
                password: pword
            },
            error: function(data, err, msg){
                console.log(msg);
            },
            success: function(data){
                // Store the Reponse to run the second login
                console.log(data);

                // Run the second ajax query to get the contact info
                $.ajax({
                    url: "https://wapi.onereach.com/api/querycontacts",
                    type: "POST",
                    contentType:'application/json',
                    data: JSON.stringify({
                        QueryParams: [
                            {Name: "First Name", Value: data.User.FirstName}
                        ],
                        Fields: [
                            'First Name', 
                            'Last Name', 
                            'TempOpenHoursFrom', 
                            'TempOpenHoursTo', 
                            'TimeZone', 
                            'TN Backup Needed', 
                            'TN Backup Phone'
                        ]
                    }),
                    headers: {
                        username: "contact@trueblue.com",
                        password: data.User.MobileNumber
                    }, 
                    error: function(data, err, msg){
                        console.log(msg);
                    },
                    complete: function(){
                        $('#login-screen').addClass('hidden');
                        $('#settings').removeClass('hidden');
                    },
                    success: function(response){
                        pageData = response;
                        console.log(pageData);

                        populateHeader();
                        populateTimezone();
                        populateOpenHours();


                        function populateHeader(){
                            //Populate the Header
                            $('span.location').html(pageData.Items[0].Data[1].Value);
                            $('#location-phone').html(
                                data.User.MobileNumber.slice(0,3) + "-" + 
                                data.User.MobileNumber.slice(3,6) + "-" + 
                                data.User.MobileNumber.slice(6,10)
                            );
                        };
                            
                        function populateTimezone(){
                            //Populate the Time Zone
                            var TZ = pageData.Items[0].Data[4].Value;
                            if(-5 < TZ || TZ < -11){
                                console.log('Error: Returned Time Zone is Outside Current Options');
                            }

                            //Grab the time zone options if value is already set
                            if(TZ != ""){
                               var zones = $('#time-zone').find('option');
                                var currentZone = undefined;
                                $.each(zones, function(index, value){
                                    if($(this).attr('value') == TZ){
                                        currentZone = index;
                                    }
                                });
                            }
                            
                            // Set the Current Time Zone to the index
                            $(selectArray[0]).dropkick({
                                initialize: function(){
                                    if(currentZone != undefined ){
                                        this.select(currentZone);
                                    }     
                                }
                            }); 
                        }

                        function populateOpenHours(){

                        };
                    }
                });
            }
        });
    };

    

    $('.accordion-toggle').on('click', function(e) {
        e.preventDefault();
        $(this).find('.arrow').toggleClass('down').toggleClass('up');
        // $(this).siblings('.accordion-body').toggleClass('open');
        $(this).siblings('.accordion-body').slideToggle(250);
    });



});