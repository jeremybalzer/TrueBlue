var pageData;
var mobileNum;
var ID;

$(document).ready(function(){

    function trace(s) {
      try { console.log(s) } catch (e) { alert(s) }
    }

// ############ Variables ############
    var apiURL = "https://ent-wapi.onereach.com/";

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

    var optionArray = "";
    for(i=0; i < 600; i++){
        var option = "<option>Branch: " + i + "</option>"; 
        optionArray = optionArray + option;
    }

    console.log(optionArray);
    $('#branch-select').append(optionArray);
    

    var selectArray = $('.dropkick');
    $('#username').val('branch1107@trueblue.com');
    $('#password').val('w3Lcome');

// ############ Attach Click Handlers ############

//     // Login the User using AJAX
    $('#login').on('click', userLogin);

    // Toggle the Locked Sections
    $('.padlock').on('click', function(){
        var sec = $(this).closest('section');
        togglePadlock(sec);
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
        } else if (that.attr('data-attr') == "True"){
            that.attr('data-attr', "False");
        } else if (that.attr('data-attr') == "False"){
            that.attr('data-attr', "True");
        }
    });

    // Update Records
    $('#time-zone').find('input.submit').on('click', updateTimezone);
    $('#open-hours').find('input.submit').on('click', updateOpenHours);
    $('#temp-hours').find('input.submit').on('click', updateTempHours);
    $('#on-call').find('input.submit').on('click', updateCallList);
    $('#transfer-number').find('input.submit').on('click', updateTransferNumber);

    $('input.submit').on('click', function(){
        var sec = $(this).closest('section');
        togglePadlock(sec);
    })
// // ############ Functions ############
    
    // Toggle Padlock
    function togglePadlock(context){
        console.log(context);
        context.toggleClass('locked').toggleClass('unlocked');
    }

    // Log in a user
    function userLogin(){
        var user = $('#username').val();
        var pword = $("#password").val();
        
        $.support.cors = true;

        if ('XDomainRequest' in window && window.XDomainRequest !== null) {
            alert('Your Browser is not compatible. Please upgrade to a modern browser.');
        } else {
            $.ajax({
                crossDomain: true,
                url: apiURL + "api/login",
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
                    queryContacts(data);
                }
            });
        }
    };

    // Run the second ajax query to get the contact info
    function queryContacts(data){
        $.ajax({
            crossDomain: true,
            url: apiURL + "/api/querycontacts",
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
                    'WhosOnCall',
                    'UseDST'
                ]
            }),
            headers: {
                username: "contact@trueblue.com",
                password: data.User.MobileNumber,
                // password: "2532525995"
            }, 
            error: function(data, err, msg){
                console.log(msg);
            },
            complete: function(){
                // $('.dropkick').click();
                $('#login-screen').addClass('hidden');
                $('#settings').removeClass('hidden');
                $('.container').css('background-color', '#eee');
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
                    $('span.location').html(pageData.Items[0].Data[1].Value + " Office");
                    $('span.location + span').html('IVR Settings for:');
                    $('#location-phone').html(
                        formatPhoneNumber(data.User.MobileNumber)
                    );
                };
                  
                // Configure the Time Zone to match the record  
                function populateTimezone(){
                    var TZ = pageData.Items[0].Data[7].Value;
                    var adjust = pageData.Items[0].Data[11].Value;
                    var isDropkick;

                    if(adjust == "true" || adjust == "false" || adjust == "True" || adjust == "False"){
                        if(adjust == "false" || adjust == "False"){
                            $('#time-zone').find('.onoffswitch-checkbox').click();
                        } 
                    } else {
                        console.log('ERROR: DST Adjust is not equal to True or False');
                    }

                    // Make Sure this is the time zone field
                    if(pageData.Items[0].Data[4].Value != "TimeZone"){
                        console.log('Time Zone Updating Correctly');
                        if(-4 < TZ || TZ < -10){
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
                    var oHourFrom = pageData.Items[0].Data[2].Value;
                    var oHourTo = pageData.Items[0].Data[3].Value;
                    console.log('Open Hours From: ' + oHourFrom);
                    console.log('Open Hours To: ' + oHourTo);
                    // var oHourFrom = "09:30";
                    // var oHourTo = "12:30";

                    // Make Sure Data is correct
                    if(pageData.Items[0].Data[2].Name == "OpenHoursFrom" && pageData.Items[0].Data[3].Name == "OpenHoursTo"){
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
                    if(pageData.Items[0].Data[4].Name == "TempOpenDate"){
                        console.log('Populating Temp Open Date');
                    }

                    var selectDate = new Date(pageData.Items[0].Data[4].Value)
                    var today = new Date();

                    // Initiate the Datepicker and Select Styling Plugins
                    $('.datepicker').pikaday({
                        format: 'MM/DD/YYYY',
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
                    var tempDate = pageData.Items[0].Data[4].Value;
                    var context;

                     // Make Sure Data is correct
                    if(pageData.Items[0].Data[5].Name == "TempOpenHoursFrom" && pageData.Items[0].Data[6].Name == "TempOpenHoursTo" && pageData.Items[0].Data[4].Name == "TempOpenDate"){
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
                    var newNums= [];
                    var nums = pageData.Items[0].Data[10].Value;
                    if(pageData.Items[0].Data[10].Name == "WhosOnCall"){
                        nums = nums.split(",");
                        $.each(nums, function(index,value){
                            var newNum = formatPhoneNumber(value);
                            newNums.push(newNum);
                        });
                        newNums = newNums.join(", ");
                        $('#call-list').val(newNums);
                        console.log('WhoIsOnCall populating with correct data');
                    } else {
                        console.log('Error: WhoIsOnCall not populating with correct data');
                    }
                    
                }

                // Configure the Transfer Number to match the record
                function populateTransferNumber(){
                    var status = pageData.Items[0].Data[8].Value; 
                    var number = formatPhoneNumber(pageData.Items[0].Data[9].Value);
                    if(status != ""){
                        if(status == "on"){
                           $('#myonoffswitch-5').click().attr('data-boolean', status); 
                        }
                    } 

                    $('#update-number').attr('placeholder', 'Current: ' + number);
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
        var adjust = $('#myonoffswitch-0').attr('data-attr');

        if(isDropkick.length != 0){
           newTime = $('#time-zone').find('.dk-option-selected').attr('data-value'); 
        } else {
            newTime = $('#time-zone').find('select').val();
        }
        
        updateContact('UseDST', adjust, context);
        updateContact('TimeZone', newTime, context);
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
                updateContact("WhosOnCall",newCallList, context);
            }
        }  
    }

    function updateTransferNumber(){
        var context = $('#transfer-number');
        var newNumber = $('#update-number').val();
        var backup = $('#myonoffswitch-5').attr('data-boolean');
        
        // If no new number is provided, update the Backup Needed Status
        if(newNumber == ""){
            updateContact('TN Backup Needed', backup, context);
        } else {
            var isTenDigits = validateNumber(newNumber);

            if(isTenDigits == -1){
                displayMsg(context, 'Please enter a valid ten digit number', true);
            } else {
                updateContact('TN Backup Phone', newNumber, context);
                updateContact('TN Backup Needed', backup, context);
                $('#update-number').val("").attr('placeholder', "Current: " + formatPhoneNumber(newNumber));
            }
        }    
    }

    function updateOpenHours(){
        var context = $('#open-hours');
        var fromHour;
        var fromAMPM;
        var toHour;
        var toAMPM;

        fromHour = $('#open-from').find('.dk-option-selected').attr('data-value');
        if(!fromHour){
            fromHour = $('#open-from').find('select').val();
        }
        fromAMPM = $('#open-from').find('#myonoffswitch-1').attr('data-time');

        toHour = $('#open-to').find('.dk-option-selected').attr('data-value');
        if(!toHour){
            toHour = $('#open-to').find('select').val();
        }
        toAMPM = $('#open-to').find('#myonoffswitch-2').attr('data-time');

        // Convert to 24 Hour Format
        fromHour = formatTime(fromHour, fromAMPM);
        toHour = formatTime(toHour, toAMPM);

        // Make sure from time is sooner than to time
        timeValidate = compareTime(fromHour, toHour);

        if(timeValidate == -1){
            displayMsg(context, "Error: Closing hour can not be before opening hour", true);
        } else {
            updateContact('OpenHoursFrom', fromHour, context);
            updateContact('OpenHoursTo', toHour, context);
        }
        
    };

    function updateTempHours(){
        var timeValidate;
        var context; 
        var fromAMPM; 
        var fromHour; 
        var toHour; 
        var toAMPM; 
        var newDate;
        var today = new Date();

        context = $('#temp-hours');
        fromHour = $('#temp-open-from').find('.dk-option-selected').attr('data-value');
        if(!fromHour){
            fromHour = $('#temp-open-from').find('select').val();
        }
        fromAMPM = $('#temp-open-from').find('#myonoffswitch-3').attr('data-time');
        toHour = $('#temp-open-to').find('.dk-option-selected').attr('data-value');
        if(!toHour){
            toHour = $('#temp-open-to').find('select').val();
        }
        toAMPM = $('#temp-open-to').find('#myonoffswitch-4').attr('data-time');
        newDate = $('.datepicker').val();
        
        today = today.getFullYear() + "/" + today.getMonth() + "/" + today.getDate();


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
                updateContact('TempOpenDate', newDate, context);
                updateContact('TempOpenHoursFrom', fromHour, context);
                updateContact('TempOpenHoursTo', toHour, context);
            }
        }
    }

    function updateContact(record, value, context){
        var status;

        $.ajax({
            url: apiURL + "api/contact/" + ID,
            type: "PUT",
            data: JSON.stringify([
                {Name: record, Value: value}                    
            ]),
            headers: {
                username: "contact@trueblue.com",
                password: mobileNum
            }, 
            complete: function(){
                if(status == "success"){
                    displayMsg(context, 'Update Successful', false);
                } else {
                    displayMsg(context, 'Server Error: Please contact support@onereach.com', true);
                }
            },
            error: function(data, err, msg) {
                console.log(msg);
                status = "error";
            },
            success: function(data){
                console.log(data);
                status = "success";
            }
        });
    }

    function displayMsg(context, msg, isError){
        var color;
        var align;

        if(isError == true) {
            // Error Messages get left on screen
            color = "#ff0000";
            align = "left";
        } else {
            align = "right";
            color = "#00AEEF";
            // Hide a successful message after it updates
            setTimeout(function(){
               context.find('.message').fadeOut(300);
            }, 2500);
        }
        context.find('.message').html(msg).show().css({'color': color, 'text-align': align});
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

        time2 = time2.split(":");
        time2 = time2[0] + time2[1];

        // Is time2 later than time1?
        if(parseInt(time1) < parseInt(time2)){
            // console.log(time1 + " is before " + time2);
            return 1;
        } else {
            // console.log(time2 + " is before " + time1);
            return -1;
        }
    }

    function formatPhoneNumber(number){
        number = "(" + number.slice(0,3) + ") " + number.slice(3,6) + "-" + number.slice(6,10);
        return number;
    }

    function validateNumber(number){
        number = parseInt(number.toString().replace(/\D/g, ''));
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