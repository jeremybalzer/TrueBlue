var pageData;
var branchData = {};

$(document).ready(function(){

    // Add console to old IE
    (function() {
      var method;
      var noop = function () {};
      var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
      ];
      var length = methods.length;
      var console = (window.console = window.console || {});

      while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
      }
    }());

    // ############ Variables ############
    var apiURL = "https://ent-wapi.onereach.com/";
    // var selectArray = $('.dropkick');



    // ############ Attach Click Handlers ############
    $('#load-branch').on('click', loadBranch);

    // Update Records
    // $('#time-zone').find('input.submit').on('click', updateTimezone);
    // $('#open-hours').find('input.submit').on('click', updateOpenHours);
    // $('#temp-hours').find('input.submit').on('click', updateTempHours);
    // $('#on-call').find('input.submit').on('click', updateCallList);
    // $('#transfer-number').find('input.submit').on('click', updateTransferNumber);

    // $('input.submit').on('click', function(){
    //     var sec = $(this).closest('section');
    //     togglePadlock(sec);
    // });

    // Toggle Padlocks
    $('.padlock').on('click', function(){
        $(this).closest('section').toggleClass('locked').toggleClass('unlocked');
    })

    // Toggle On/Off Switches
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

    // ############ Make the initial call ############
    if ('XDomainRequest' in window && window.XDomainRequest !== null) {
        alert('Your Browser is not compatible. Please upgrade to a modern browser.');
    } else {
        $.ajax({
            crossDomain: true,
            url: apiURL + "/api/querycontacts",
            type: "POST",
            contentType:'application/json',
            data: JSON.stringify({
                QueryParams: [
                    {Name: "Email Address", Value: "-br@laborready.com"}
                ],
                Fields: [
                    'Line1',
                    'First Name', 
                    'Last Name', 
                    'TempOpenHoursFrom', 
                    'TempOpenHoursTo',
                    'TempOpenDateTo',
                    'TempOpenDateFrom', 
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
                password: "2532525995"
            }, 
            error: function(data, err, msg){
                console.log(msg);
            },
            success: function(response){
                pageData = response;
                loadBranches();
                populateTimeSelects();
            }
        });
    };

    function loadBranches(){
        console.log(pageData);
        var optionList = "";

        // For each branch build a select
        $.each(pageData.Items, function(index, value){
            // console.log(value);
            var option = "<option data-attr='" + value.Id + "'>Branch " + value.Data[0].Value + ": " + value.Data[1].Value + "</option>"; 
            optionList = optionList + option;
        });

        // Attach options to branch select
        $('#branch-select').append(optionList).dropkick();
    }

    // This grabs the branchData for the object in the Select Your Branch option
    function loadBranch(){
        // Grab the Branch Number
        var selected = $('#branch-select').val().slice(7,11);

        data = _.find(pageData.Items, function(obj){
            return obj.Data[0].Value == selected;
        });

        branchData.ID = data.Id;
        branchData.shortCode = data.Data[0].Value; 
        branchData.office = data.Data[1].Value;
        branchData.phone = data.Data[2].Value;
        branchData.openHoursFrom = data.Data[3].Value;
        branchData.openHoursTo = data.Data[4].Value;
        branchData.tempOpenHoursFrom = data.Data[5].Value;
        branchData.tempOpenHoursTo = data.Data[6].Value;
        branchData.timeZone = data.Data[7].Value;
        branchData.backupNeeded = data.Data[8].Value;
        branchData.backupNumber = data.Data[9].Value;
        branchData.whosOnCall = data.Data[10].Value;
        branchData.useDST = data.Data[11].Value;
        branchData.tempDateOpenTo = data.Data[12].Value;
        branchData.tempDateOpenFrom = data.Data[13].Value;

        console.log(branchData);

        buildPage();
    }

    function buildPage(){
        populateHeader();
        populateTimezone();
        populateOpenHours();

        populateTransferNumber();
        showSections();
    }

     // Populate the Header
    function populateHeader(){
        $('span.location').html(branchData.office + " Office");
        $('span.location + span').html('IVR Settings for:');
        $('#location-phone').html(
            formatPhoneNumber(branchData.phone)
        );
    };

        // Configure the Time Zone to match the record  
    function populateTimezone(){
        var TZ = branchData.timeZone;
        var adjust = branchData.useDST;
        var isDropkick;
        var status = $('#myonoffswitch-0').attr('data-attr');

        // Default to Eastern Time
        if(TZ == ""){
            TZ = "-4";
        } 

        //Default to Use DST
        if(adjust == ""){
            adjust = "true";
        }

        if(adjust == "false" || adjust == "False"){
            if(status == "True" || status == "true"){
                $('#time-zone').find('.onoffswitch-checkbox').click();
            }
        } else if (adjust == "true" || adjust == "True") {
            if(status == "false" || status == "False"){
                $('#time-zone').find('.onoffswitch-checkbox').click();
            }
        }

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
        $('#time-zone').find('.dropkick').dropkick({
            initialize: function(){
                if(currentZone != undefined ){
                    this.select(currentZone);
                }     
            }
        }); 

        isDropkick = $('#time-zone').find('.dk-option-selected');
        if(isDropkick.length == 0){
            var toFind = 'option[value="' + TZ + '"]';
            $('#time-zone').find(toFind).attr('selected', 'selected');
        } 
    }

    // Configure the Open Hours to match the record
    function populateOpenHours(){
        // Get Both Times
        var oHourFrom = branchData.openHoursFrom;
        var oHourTo = branchData.openHoursTo;
        console.log(oHourFrom);
        console.log(oHourTo);
        var context; 

        // Are times populated? 
        if(oHourFrom != "" && oHourTo != ""){

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
            }
        } 

        // If the times aren't populated, prompt for an update and dropkick the selects
        else {
            context = $('#open-hours');
            $('#open-from').find('.dk-selected').html('0:00');
            $('#open-to').find('.dk-selected').html('0:00');
            displayMsg(context, "Please Update Open Hours", true);
        }

        doDropkick($('#open-from'));
        doDropkick($('#open-to'));
    };


    // Configure the Transfer Number to match the record
    function populateTransferNumber(){
        var isNeeded = branchData.backupNeeded; 
        var number = formatPhoneNumber(branchData.backupNumber);
        var status = $('#myonoffswitch-5').attr('data-boolean');
        if(isNeeded != ""){
            if(isNeeded == "on"){
                if(status == "off" || status == "Off"){
                    $('#myonoffswitch-5').click().attr('data-boolean', isNeeded); 
                }
            }
        } 

        if(branchData.backupNumber == ""){
            $('#update-number').attr('placeholder', 'No Backup Number in Record');
        } else {
           $('#update-number').attr('placeholder', 'Current: ' + number); 
        } 
    }

    // Toggle Padlock
    function togglePadlock(context){
        context.toggleClass('locked').toggleClass('unlocked');
    }

    function showSections(){
        var sections = $('section');
        $.each(sections, function(index, value){
            var isHidden = $(this).hasClass('hidden');
            if(isHidden == true){
                $(this).removeClass('hidden');
            }
        })
    };

    function formatPhoneNumber(number){
        number = "(" + number.slice(0,3) + ") " + number.slice(3,6) + "-" + number.slice(6,10);
        return number;
    }
});

function doDropkick(context){
    var isKicked = context.find('.dk-select-options');
    if(isKicked.length == 0){
        context.find('.dropkick').dropkick();
    }
}

 // Make sure time2 is later than time1
function compareTime(time1, time2){
    time1 = time1.split(":");
    time1 = time1[0] + time1[1];

    time2 = time2.split(":");
    time2 = time2[0] + time2[1];

    // Is time2 later than time1?
    if(parseInt(time1) < parseInt(time2)){
        return 1;
    } else {
        return -1;
    }
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

function populateTimeSelects(){
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
};

// Split the time into Hours and Minutes and update the control
function timeSplitter(time, context){
    var dk;
    var optionArray;
    var absTime;
    var status;

    time = time.split(":");
    
    // Toggle the AM/PM Switch
    if(time[0] < 12){
    } else {
        //adjust to a 12 hour clock
        if(12 < time[0]){
            time[0] = parseInt(time[0]) - 12;
        }
        // Toggle the AM/PM switch to PM
        var status = context.find('.onoffswitch-checkbox').attr('data-time');
        if(status == "am" || status == "AM"){
            context.find('.onoffswitch-checkbox').click();
        }
    }

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



    
// // ############ Functions ############
    
    
    // Update Time Zone
    // function updateTimezone(){
    //     var newTime;
    //     var context = $('#time-zone');
    //     var isDropkick = $('#time-zone').find('.dk-option-selected');
    //     var adjust = $('#myonoffswitch-0').attr('data-attr');

    //     if(isDropkick.length != 0){
    //        newTime = $('#time-zone').find('.dk-option-selected').attr('data-value'); 
    //     } else {
    //         newTime = $('#time-zone').find('select').val();
    //     }
        
    //     updateContact('UseDST', adjust, context);
    //     updateContact('TimeZone', newTime, context);
    // }
    

    

    // function updateCallList(){
    //     var context = $('#on-call');
    //     var newList = $('#call-list').val();
    //     var flag;

    //     // If List is Empty Don't Submit
    //     if(newList == ""){
    //         displayMsg(context, "Please enter at least one ten digit number to be on call", true);
    //     } else {
    //         var newListArray = newList.split(",");
    //         var flagArray = [];
    //         var newCallList = "";
    //         if(0 < newListArray.length){
                
    //             $.each(newListArray, function(index, value){
    //                 flag = validateNumber(value);
    //                 // console.log(flag);
    //                 if(flag == -1){
    //                     displayMsg(context, "Please enter ten digits numbers separated by commas and no spaces", true);
    //                     flagArray.push(flag);
    //                 } else {
    //                     if(newCallList == "") {
    //                         newCallList = flag.toString();
    //                     } else {
    //                         newCallList = newCallList + "," + flag;
    //                     }
    //                 }
    //             }); 
    //         }
    //         if( flagArray.length == 0) {
    //             updateContact("WhosOnCall",newCallList, context);
    //         }
    //     }  
    // }

    // function updateTransferNumber(){
    //     var context = $('#transfer-number');
    //     var newNumber = $('#update-number').val();
    //     var backup = $('#myonoffswitch-5').attr('data-boolean');
        
    //     // If no new number is provided, update the Backup Needed Status
    //     if(newNumber == ""){
    //         updateContact('TN Backup Needed', backup, context);
    //     } else {
    //         var isTenDigits = validateNumber(newNumber);

    //         if(isTenDigits == -1){
    //             displayMsg(context, 'Please enter a valid ten digit number', true);
    //         } else {
    //             updateContact('TN Backup Phone', newNumber, context);
    //             updateContact('TN Backup Needed', backup, context);
    //             $('#update-number').val("").attr('placeholder', "Current: " + formatPhoneNumber(newNumber));
    //         }
    //     }    
    // }

    // function updateOpenHours(){
    //     var context = $('#open-hours');
    //     var fromHour;
    //     var fromAMPM;
    //     var toHour;
    //     var toAMPM;

    //     fromHour = $('#open-from').find('.dk-option-selected').attr('data-value');
    //     if(!fromHour){
    //         fromHour = $('#open-from').find('select').val();
    //     }
    //     fromAMPM = $('#open-from').find('#myonoffswitch-1').attr('data-time');

    //     toHour = $('#open-to').find('.dk-option-selected').attr('data-value');
    //     if(!toHour){
    //         toHour = $('#open-to').find('select').val();
    //     }
    //     toAMPM = $('#open-to').find('#myonoffswitch-2').attr('data-time');

    //     // Convert to 24 Hour Format
    //     fromHour = formatTime(fromHour, fromAMPM);
    //     toHour = formatTime(toHour, toAMPM);

    //     // Make sure from time is sooner than to time
    //     timeValidate = compareTime(fromHour, toHour);

    //     if(timeValidate == -1){
    //         displayMsg(context, "Error: Closing hour can not be before opening hour", true);
    //     } else {
    //         updateContact('OpenHoursFrom', fromHour, context);
    //         updateContact('OpenHoursTo', toHour, context);
    //     }
        
    // };

    // function updateTempHours(){
    //     var timeValidate;
    //     var context; 
    //     var fromAMPM; 
    //     var fromHour; 
    //     var toHour; 
    //     var toAMPM; 
    //     var newDate;
    //     var today = new Date();

    //     context = $('#temp-hours');
    //     fromHour = $('#temp-open-from').find('.dk-option-selected').attr('data-value');
    //     if(!fromHour){
    //         fromHour = $('#temp-open-from').find('select').val();
    //     }
    //     fromAMPM = $('#temp-open-from').find('#myonoffswitch-3').attr('data-time');
    //     toHour = $('#temp-open-to').find('.dk-option-selected').attr('data-value');
    //     if(!toHour){
    //         toHour = $('#temp-open-to').find('select').val();
    //     }
    //     toAMPM = $('#temp-open-to').find('#myonoffswitch-4').attr('data-time');
    //     newDate = $('.datepicker').val();
        
    //     today = today.getFullYear() + "/" + today.getMonth() + "/" + today.getDate();


    //     // Convert to 24 Hour Format
    //     fromHour = formatTime(fromHour, fromAMPM);
    //     toHour = formatTime(toHour, toAMPM);

    //     // Make sure from time is sooner than to time
    //     timeValidate = compareTime(fromHour, toHour);

    //     // Throw Error if no date is selected
    //     if(newDate == ""){
    //         displayMsg(context, "Please select a date to set temporary open hours", true); 
    //     } else {
    //         // Throw Error If Time Don't Validate
    //         if(timeValidate == -1){
    //             displayMsg(context, "Error: Closing hour can not be before opening hour", true);
    //         } else {
    //             updateContact('TempOpenDate', newDate, context);
    //             updateContact('TempOpenHoursFrom', fromHour, context);
    //             updateContact('TempOpenHoursTo', toHour, context);
    //         }
    //     }
    // }

    // function updateContact(record, value, context){
    //     var status;

    //     $.ajax({
    //         url: apiURL + "api/contact/" + ID,
    //         type: "PUT",
    //         data: JSON.stringify([
    //             {Name: record, Value: value}                    
    //         ]),
    //         headers: {
    //             username: "contact@trueblue.com",
    //             password: mobileNum
    //         }, 
    //         complete: function(){
    //             if(status == "success"){
    //                 displayMsg(context, 'Update Successful', false);
    //             } else {
    //                 displayMsg(context, 'Server Error: Please contact support@onereach.com', true);
    //             }
    //         },
    //         error: function(data, err, msg) {
    //             console.log(msg);
    //             status = "error";
    //         },
    //         success: function(data){
    //             console.log(data);
    //             status = "success";
    //         }
    //     });
    // }

    

    // function formatTime(time, halfday){
    //     time = time.split(":");

    //     if (halfday == "am" && parseInt(time[0]) == 12) {
    //         time = parseInt(time[0] - 12) + ":" + time[1];
    //     } else if (halfday == "pm" && parseInt(time[0]) != 12) {
    //         time = parseInt(time[0]) + 12 + ":" + time[1];
    //     } else {
    //         time = parseInt(time[0]) + ":" + time[1];
    //     }
    //     // console.log(time, halfday);
    //     return time;
    // }

   

   

    // function validateNumber(number){
    //     number = parseInt(number.toString().replace(/\D/g, ''));
    //     console.log(number);
    //     isNumber = isNaN(number);
    //     console.log(isNumber);

    //     if(number.toString().split("").length != 10){
    //         return -1;
    //     } else if (isNumber == true) {
    //         return -1;
    //     } else {
    //         return number;
    //     }
    // };
