var pageData;
var mobileNum;

$(document).ready(function(){

// ############ Variables ############
    // var pageData, hourInput;
    var ID;
    var updateURL = "https://wapi.onereach.com/api/contact";

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

    // Toggle the AM/PM Switches
    $('.onoffswitch-checkbox').on('click', function(){
        var that = $(this);
        if(that.attr('data-time') == "am"){
            that.attr('data-time', 'pm');
        } else if (that.attr('data-time') == "pm"){
            that.attr('data-time', 'am');
        } else if (that.attr('data-boolean') == "on"){
            that.attr('data-boolean', "off");
        } else if (that.attr('data-boolean') == "off"){
            that.attr('data-boolean', "on");
        }
    })

    // See Who is on a Call
    $('.accordion-toggle').on('click', function(e) {
        e.preventDefault();
        $(this).find('.arrow').toggleClass('down').toggleClass('up');
        // $(this).siblings('.accordion-body').toggleClass('open');
        $(this).siblings('.accordion-body').slideToggle(250);
    });

    // Update TimeZone
    $('#time-zone').find('input.submit').on('click', updateTimezone);

    // Update Open Hours
    $('#open-hours').find('input.submit').on('click', updateOpenHours);

    // Update Transfer Number
    $('#transfer-number').find('input.submit').on('click', updateTransferNumber);

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
                mobileNum = data.User.MobileNumber;

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
                            'TN Backup Phone',
                            'OpenHoursTo',
                            'OpenHoursFrom'
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
                        console.log(pageData.Items[0].Data);
                        ID = pageData.Items[0].Id;

                        populateHeader();
                        populateTimezone();
                        populateOpenHours();
                        populateTransferNumber();


                        function populateHeader(){
                            //Populate the Header
                            $('span.location').html(pageData.Items[0].Data[1].Value);
                            $('#location-phone').html(
                                data.User.MobileNumber.slice(0,3) + "-" + 
                                data.User.MobileNumber.slice(3,6) + "-" + 
                                data.User.MobileNumber.slice(6,10)
                            );
                        };
                          
                        // Configure the Time Zone to match the record  
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

                        // Configure the Open Hours to match the record
                        function populateOpenHours(){

                        };

                        // Configure the Temp Hours to match the record
                        function populateTempHours(){

                        }

                        // Configure the Transfer Number to match the record
                        function populateTransferNumber(){
                            var status = pageData.Items[0].Data[2].Value; 
                            if(status != ""){
                                $('#myonoffswitch-5').attr('data-boolean', status);

                                // If Status is 'On', toggle the switch
                                if(status == "on"){
                                    $('#myonoffswitch-5').click()
                                }
                            }
                            $('#update-number').attr('placeholder', 'Current: ' + pageData.Items[0].Data[3].Value);
                        }
                    }
                });
            }
        });
    };

    // Update Time Zone
    function updateTimezone(){
        context = $('#time-zone');
        console.log('updating');
        var newTime = $('#time-zone').find('.dk-option-selected').attr('data-value');
        updateContact(5, 'TimeZone', newTime);
        displayMsg(context, 'Update Successful', false);
    }

    function updateTransferNumber(){
        var context = $('#transfer-number');
        var newNumber = $('#update-number').val();
        var backup = $('#myonoffswitch-5').attr('data-boolean');
        
        var isTenDigits = validateNumber(newNumber)

        // If no new number is provided, update the Backup Needed Status
        if(newNumber == ""){
            updateContact(2, 'TN Backup Needed', backup);
            displayMsg(context, 'Update Successful', false);
        } else {
            if(isTenDigits == -1){
                displayMsg(context, 'Please enter a valid ten digit number', true);
            } else {
                updateContact(4, 'TN Backup Phone', newNumber);
                updateContact(2, 'TN Backup Needed', backup);
                displayMsg(context, 'Update Successful', false);
            }
        }    
    }

    function updateOpenHours(){
        var context = $('#open-hours');
        var fromHour = $('#open-from').find('.dk-option-selected').attr('data-value').replace(':', '');;
        var fromAMPM = $('#open-from').find('#myonoffswitch-1').attr('data-time');
        var toHour = $('#open-to').find('.dk-option-selected').attr('data-value').replace(':', '');;
        var toAMPM = $('#open-to').find('#myonoffswitch-2').attr('data-time');;

        // console.log(fromHour);
        // console.log(toHour);

        if(toAMPM == 'pm' && fromAMPM == "am"){
            displayMsg(context, 'Update Successful', false);
        } else if (toAMPM == fromAMPM && fromHour < toHour){
            displayMsg(context, 'Update Successful', false);
        } else if(toAMPM == fromAMPM && fromHour == toHour){
            displayMsg(context, 'Error: The end time must be later than the start time', true);
        } else {
            displayMsg(context, "Error: Closing hour can not be before opening hour", true);
        }
        // if()
        // updateContact(3, 'OpenHoursFrom', fromHour + fromAMPM);
        // updateContact(4, 'OpenHoursTo', toHour + toAMPM);
    };

    function updateContact(index, record, value){
        $.ajax({
            url: "https://wapi.onereach.com/api/contact/" + ID,
            type: "PUT",
            data: JSON.stringify([
                {Name: record, Value: value}                    
            ]),
            headers: {
                username: "contact@trueblue.com",
                password: mobileNum
            }, 
            error: function(data, err, msg) {
                console.log(msg);
            },
            success: function(data){
                console.log(data);
            }
        });
    }

    function displayMsg(context, msg, isError){
        var color;

        if(isError == true) {
            // Error Messages get left on screen
            color = "#ff0000";
        } else {
            color = "#00AEEF";
            // Hide a successful message after it updates
            setTimeout(function(){
               context.find('.message').fadeOut(300);
            }, 2500);
        }
        context.find('.message').html(msg).show().css('color', color);
    }

    function validateNumber(number){
        numArray = number.toString().split("");
        if(numArray.length != 10) {
            console.log('Array Length is: ' + numArray.length);
            return -1;
        } else {
            arrayTest = [];

            // Evaluate each value to see if it's a number
            $.each(numArray, function(index, value){
                value = isNaN(value);
                if(value == true){
                    arrayTest.push(true)
                } else {
                    arrayTest.push(false);
                }
            });

            // any of the values aren't a number return a flag
            if(
                arrayTest[0] == true ||
                arrayTest[1] == true ||
                arrayTest[2] == true ||
                arrayTest[3] == true ||
                arrayTest[4] == true ||
                arrayTest[5] == true ||
                arrayTest[6] == true ||
                arrayTest[7] == true ||
                arrayTest[8] == true ||
                arrayTest[9] == true 
            ){
                return -1;
            }
        }
    };

});