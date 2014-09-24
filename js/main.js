var pageData;
var mobileNum;
var ID;

$(document).ready(function(){

// ############ Variables ############
    // var pageData, hourInput;
    // var ID;
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

    var selectArray = $('.dropkick');

    // Hard Code in login data temporarily
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

    // Update Records
    $('#time-zone').find('input.submit').on('click', updateTimezone);
    $('#open-hours').find('input.submit').on('click', updateOpenHours);
    $('#temp-hours').find('input.submit').on('click', updateTempHours);
    $('#on-call').find('input.submit').on('click', updateCallList);
    $('#transfer-number').find('input.submit').on('click', updateTransferNumber);

// ############ Functions ############

    // Log in a user
    function userLogin(){
        var user = $('#username').val();
        var pword = $("#password").val();
        
        $.support.cors = true;

        $.ajax({
            crossDomain: true,
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
                // console.log(data);
                mobileNum = data.User.MobileNumber;
                queryContacts(data);
            }
        });
    };

    // Run the second ajax query to get the contact info
    function queryContacts(data){
        $.ajax({
            crossDomain: true,
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
                    'TempOpenDate', 
                    'TimeZone', 
                    'TN Backup Needed', 
                    'TN Backup Phone',
                    'OpenHoursTo',
                    'OpenHoursFrom',
                    'WhosOnCall'
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
                // $('.dropkick').click();
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
                populateTempDate();
                populateTempHours();
                populateWhoIsOnCall();
                populateTransferNumber();

                // Populate the Header
                function populateHeader(){
                    $('span.location').html(pageData.Items[0].Data[1].Value);
                    $('#location-phone').html(
                        data.User.MobileNumber.slice(0,3) + "-" + 
                        data.User.MobileNumber.slice(3,6) + "-" + 
                        data.User.MobileNumber.slice(6,10)
                    );
                };
                  
                // Configure the Time Zone to match the record  
                function populateTimezone(){
                    var TZ = pageData.Items[0].Data[4].Value;
                    var isDropkick;

                    // Make Sure this is the time zone field
                    if(pageData.Items[0].Data[4].Value != "TimeZone"){
                        console.log('Time Zone Updating Correctly');
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

                        isDropkick = $('#time-zone').find('.dk-option-selected');
                        if(isDropkick.length == 0){
                            var toFind = 'option[value="' + TZ + '"]';
                            // debugger;
                            $('#time-zone').find(toFind).attr('selected', 'selected');
                        }


                    } else {
                        console.log("Error: Time Zone Not Updating with Correct Data");
                    }
                }

                // Configure the Open Hours to match the record
                function populateOpenHours(){
                    // Get Both Times
                    var oHourFrom = pageData.Items[0].Data[10].Value;
                    var oHourTo = pageData.Items[0].Data[9].Value;
                    console.log('Open Hours From: ' + oHourFrom);
                    console.log('Open Hours To: ' + oHourTo);
                    // var oHourFrom = "09:30";
                    // var oHourTo = "12:30";

                    // Make Sure Data is correct
                    if(pageData.Items[0].Data[10].Name == "OpenHoursFrom" && pageData.Items[0].Data[9].Name == "OpenHoursTo"){
                        console.log('Open Hours Updating with Correct Data');
                        var context; 

                        // Are times populated? 
                        if(oHourFrom != "" && oHourTo != ""){
                            console.log('Open Hours To & From Are Not Empty');

                            //is time2 later than time1? 
                            var flag = compareTime(oHourFrom, oHourTo);

                            //If times validate adjust the select elements, otherwise display an error
                            if(flag == 1){
                                context = $('#open-from');
                                timeSplitter(oHourFrom, context);

                                context = $('#open-to');
                                timeSplitter(oHourTo, context);
                            } 

                            // Times don't validate, prompt user to update them
                            else {
                                console.log('Open Hours Time From must be earlier than Time To');
                                context = $('#open-hours');
                                displayMsg(context, "Please Update Open Hours", true);

                                // Dropkick the options anyway
                                $('#open-from').find('.dropkick').dropkick();
                                $('#open-to').find('.dropkick').dropkick();
                            }
                        } 

                        // If the times aren't populated, prompt for an update and dropkick the selects
                        else {
                            context = $('#open-hours');
                            displayMsg(context, "Please Update Open Hours", true);

                            // Dropkick the options anyway
                            $('#open-from').find('.dropkick').dropkick();
                            $('#open-to').find('.dropkick').dropkick();
                        }
                    } else {
                        // Throw a console error
                        console.log('Error: Open Hours Data Not Pulling from Proper Fields');
                    }
                };

                // Configure the Temp Hour Date to match the record
                function populateTempDate(){
                    if(pageData.Items[0].Data[8].Name == "TempOpenDate"){
                        console.log('Populating Temp Open Date');
                    }

                    var selectDate = new Date(pageData.Items[0].Data[8].Value)
                    var today = new Date();

                    // Initiate the Datepicker and Select Styling Plugins
                    $('.datepicker').pikaday({
                        minDate: today,
                        defaultDate: selectDate,
                        setDefaultDate: true,
                        onSelect: function(){
                            var date = document.createTextNode(this.getMoment().format('DD MM YYYY'))
                            $('.selected').html(date);
                        }
                    });
                }

                // Configure the Temp Hours to match the record
                function populateTempHours(){
                    // Get Both Times
                    var tempHourFrom = pageData.Items[0].Data[5].Value;
                    var tempHourTo = pageData.Items[0].Data[6].Value;
                    var tempDate = pageData.Items[0].Data[8].Value;
                    var context;

                     // Make Sure Data is correct
                    if(pageData.Items[0].Data[5].Name == "TempOpenHoursFrom" && pageData.Items[0].Data[6].Name == "TempOpenHoursTo" && pageData.Items[0].Data[8].Name == "TempOpenDate"){
                        console.log('Temp Open Hours Updating with Correct Data and Correct Date');
                        
                        // Are times populated? 
                        if(tempHourFrom != "" && tempHourTo != ""){
                            console.log('Temp Open Hours To & From Are Not Empty');

                            //is time2 later than time1? 
                            var flag = compareTime(tempHourFrom, tempHourTo);

                            //If times validate adjust the select elements, otherwise display an error
                            if(flag == 1){
                                context = $('#temp-open-from');
                                timeSplitter(tempHourFrom, context);

                                context = $('#temp-open-to');
                                timeSplitter(tempHourTo, context);
                            } 

                            // Times don't validate, prompt user to update them
                            else {
                                console.log('Temp Open Hours Time From must be earlier than Time To');
                                context = $('#temp-hours');
                                displayMsg(context, "Please Update Temporary Open Hours", true);

                                // Dropkick the options anyway
                                $('#temp-open-from').find('.dropkick').dropkick();
                                $('#temp-open-to').find('.dropkick').dropkick();
                            }
                        } 

                        // If the times aren't populated, prompt for an update and dropkick the selects
                        else {
                            context = $('#temp-hours');
                            displayMsg(context, "Please Update Temporary Open Hours", true);

                            // Dropkick the options anyway to match styling
                            $('#temp-open-from').find('.dropkick').dropkick();
                            $('#temp-open-to').find('.dropkick').dropkick();
                        }
                    } else {
                        console.log('Error: Temporary Open Hours Data Not Pulling from Proper Fields');
                    }
                }

                // Configure Who is on Call
                function populateWhoIsOnCall(){
                    $('#call-list').val(pageData.Items[0].Data[7].Value);
                }

                // Configure the Transfer Number to match the record
                function populateTransferNumber(){
                    var status = pageData.Items[0].Data[2].Value; 
                    if(status != ""){
                        if(status == "on"){
                           $('#myonoffswitch-5').click().attr('data-boolean', status); 
                        }
                    } 

                    $('#update-number').attr('placeholder', 'Current: ' + pageData.Items[0].Data[3].Value);
                }


                // Split the time into Hours and Minutes and update the control
                function timeSplitter(time, context){
                    var dk, optionArray, absTime;
                    time = time.split(":");
                    
                    // Toggle the AM/PM Switch
                    if(time[0] < 12){
                        // Leave On/Off Switch at AM
                    } else {
                        //adjust to a 12 hour clock
                        if(12 < time[0]){
                            time[0] = parseInt(time[0]) - 12;
                        }
                        // Toggle the AM/PM switch to PM
                        context.find('.onoffswitch-checkbox').click();
                    }

                    // Dropkick the element
                    context.find('.dropkick').dropkick();

                    // Update the selected option by getting all the options
                    optionArray = context.find('.dk-option');

                    // Get an absolute value of the time to compare
                    if(parseInt(time[0]) == 0){
                        time[0] = "12";
                    };

                    var absTime = parseInt(time[0]) + ":" + time[1];
                    context.find('li[data-value="'+ absTime +'"]').click();
                    $('div.dk-select').removeClass('dk-select-open-down');

                    // If dropkick isn't initiated manually grab the proper select
                    if(optionArray.length == 0){
                        var toFind = 'option[value="' + absTime + '"]';
                        context.find(toFind).attr('selected', 'selected');
                    }
                }
            }
        })
    };

    // Update Time Zone
    function updateTimezone(){
        var newTime;
        var context = $('#time-zone');
        var isDropkick = $('#time-zone').find('.dk-option-selected');
        if(isDropkick.length != 0){
           newTime = $('#time-zone').find('.dk-option-selected').attr('data-value'); 
        } else {
            newTime = $('#time-zone').find('select').val();
        }
        
        updateContact('TimeZone', newTime);
        displayMsg(context, 'Update Successful', false);
    }

    function updateCallList(){
        var context = $('#on-call');
        var newList = $('#call-list').val();
        var flag;

        // If List is Empty Don't Submit
        if(newList == ""){
            displayMsg(context, "Please enter at least one ten digit number to be on call", true);
        } else {
            var newListArray = newList.split(",");
            var flagArray = [];
            var newCallList = "";
            if(0 < newListArray.length){
                
                $.each(newListArray, function(index, value){
                    flag = validateNumber(value);
                    // console.log(flag);
                    if(flag == -1){
                        displayMsg(context, "Please enter ten digits numbers separated by commas and no spaces", true);
                        flagArray.push(flag);
                    } else {
                        if(newCallList == "") {
                            newCallList = flag.toString();
                        } else {
                            newCallList = newCallList + "," + flag;
                        }
                    }
                }); 
            }
            if( flagArray.length == 0) {
                displayMsg(context, "Update Successful", false);
                // console.log(newCallList);
                updateContact("WhosOnCall",newCallList);
            }
        }  
    }

    function updateTransferNumber(){
        var context = $('#transfer-number');
        var newNumber = $('#update-number').val();
        var backup = $('#myonoffswitch-5').attr('data-boolean');
        
        // If no new number is provided, update the Backup Needed Status
        if(newNumber == ""){
            updateContact('TN Backup Needed', backup);
            displayMsg(context, 'Update Successful', false);
        } else {
            
            var isTenDigits = validateNumber(newNumber);

            if(isTenDigits == -1){
                displayMsg(context, 'Please enter a valid ten digit number', true);
            } else {
                updateContact('TN Backup Phone', newNumber);
                updateContact('TN Backup Needed', backup);
                displayMsg(context, 'Update Successful', false);
            }
        }    
    }

    function updateOpenHours(){
        var context = $('#open-hours');
        var fromHour = $('#open-from').find('.dk-option-selected').attr('data-value');
        if(!fromHour){
            fromHour = $('#open-from').find('select').val();
        }
        var fromAMPM = $('#open-from').find('#myonoffswitch-1').attr('data-time');
        var toHour = $('#open-to').find('.dk-option-selected').attr('data-value');
        if(!toHour){
            toHour = $('#open-to').find('select').val();
        }
        var toAMPM = $('#open-to').find('#myonoffswitch-2').attr('data-time');
        // Convert to 24 Hour Format
        fromHour = formatTime(fromHour, fromAMPM);
        toHour = formatTime(toHour, toAMPM);

        // Make sure from time is sooner than to time
        timeValidate = compareTime(fromHour, toHour);

        if(timeValidate == -1){
            displayMsg(context, "Error: Closing hour can not be before opening hour", true);
        } else {
            doUpdate();
            displayMsg(context, 'Update Successful', false);
        }
        
        function doUpdate(){
            updateContact('OpenHoursFrom', fromHour);
            updateContact('OpenHoursTo', toHour);
        }
    };

    function updateTempHours(){
        var timeValidate;
        var context = $('#temp-hours');
        var fromHour = $('#temp-open-from').find('.dk-option-selected').attr('data-value');
        if(!fromHour){
            fromHour = $('#temp-open-from').find('select').val();
        }
        var fromAMPM = $('#temp-open-from').find('#myonoffswitch-3').attr('data-time');
        var toHour = $('#temp-open-to').find('.dk-option-selected').attr('data-value');
        if(!toHour){
            toHour = $('#temp-open-to').find('select').val();
        }
        var toAMPM = $('#temp-open-to').find('#myonoffswitch-4').attr('data-time');
        var newDate = $('.datepicker').val();
        var today = new Date();
        today = today.getFullYear() + "/" + today.getMonth() + "/" + today.getDate();
        console.log(today);

        // Convert to 24 Hour Format
        fromHour = formatTime(fromHour, fromAMPM);
        toHour = formatTime(toHour, toAMPM);

        // Make sure from time is sooner than to time
        timeValidate = compareTime(fromHour, toHour);

        // Throw Error if no date is selected
        if(newDate == ""){
            displayMsg(context, "Please select a date to set temporary open hours", true); 
        } else {
            // Throw Error If Time Don't Validate
            if(timeValidate == -1){
                displayMsg(context, "Error: Closing hour can not be before opening hour", true);
            } else {
                doUpdate();
                displayMsg(context, 'Update Successful', false);
            }
        }
        
        function doUpdate(){
            updateContact('TempOpenDate', newDate);
            updateContact('TempOpenHoursFrom', fromHour);
            updateContact('TempOpenHoursTo', toHour);
        }
    }

    function updateContact(record, value){
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

    function formatTime(time, halfday){
        time = time.split(":");

        if (halfday == "am" && parseInt(time[0]) == 12) {
            time = parseInt(time[0] - 12) + ":" + time[1];
        } else if (halfday == "pm" && parseInt(time[0]) != 12) {
            time = parseInt(time[0]) + 12 + ":" + time[1];
        } else {
            time = parseInt(time[0]) + ":" + time[1];
        }
        // console.log(time, halfday);
        return time;
    }

    // Make sure time2 is later than time1
    function compareTime(time1, time2){
        time1 = time1.split(":");
        time1 = time1[0] + time1[1];
        // console.log("Time1: " + time1);

        time2 = time2.split(":");
        time2 = time2[0] + time2[1];
        // console.log("Time2: " + time2);

        // Is time2 later than time1?
        if(parseInt(time1) < parseInt(time2)){
            // console.log(time1 + " is before " + time2);
            return 1;
        } else {
            // console.log(time2 + " is before " + time1);
            return -1;
        }
    }

    function validateNumber(number){

        number = parseInt(number.toString().replace(/\s+/g, ''));
        console.log(number);
        isNumber = isNaN(number);
        console.log(isNumber);

        if(number.toString().split("").length != 10){
            return -1;
        } else if (isNumber == true) {
            return -1;
        } else {
            return number;
        }
    };

});