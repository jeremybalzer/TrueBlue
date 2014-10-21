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

    // ############ Add Time Selects ############
    populateTimeSelects();

    // ############ Variables ############
    var apiURL = "http://entor-wapi.onereach.com/";

    // ############ Attach Click Handlers ############
    $('#load-branch').on('click', loadBranch);

    // Update Records
    $('#time-zone').find('input.submit').on('click', updateTimezone);
    $('#open-hours').find('input.submit').on('click', updateOpenHours);
    $('#temp-hours').find('input.submit').on('click', updateTempHours);
    $('#on-call').find('input.submit').on('click', updateCallList);
    $('#transfer-number').find('input.submit').on('click', updateTransferNumber);

    $('input.submit').on('click', function(){
        var sec = $(this).closest('section');
        togglePadlock(sec);
    });

    $('.padlock').on('click', function(e){
        e.preventDefault();
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
        loadPageData();
    };

    function loadPageData(){
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
                console.log(pageData);
                loadBranches();
            }
        });
    }

    function loadBranches(){
        var optionList = "";
        var optionArray = [];
        var homeBranch;
        var isKicked;

        // For each branch build a select
        $.each(pageData.Items, function(index, value){
            // console.log(value);
            var option = "<option data-attr='" + value.Id + "'>Branch " + value.Data[0].Value + ": " + value.Data[1].Value + "</option>"; 
            var opObj = {
                element: option,
                name: value.Data[1].Value,
                key: value.Data[0].Value
            }
            
            optionArray.push(opObj);
        });

        optionArray = _.sortBy(optionArray, 'name');
        $.each(optionArray, function(index, value){
            optionList = optionList + value.element;
        });

        $('#branch-select').append(optionList)

        optionList = $('#branch-select option');
        $.each(optionList, function(index, value){
            var that = $(this).val();
            var branch = getCookie('branch');
            if(that == branch){
                $(this).attr('selected', 'selected');
            } 
        });

        $('#branch-select').dropkick();
    }

    // This grabs the branchData for the object in the Select Your Branch option
    function loadBranch(){
        // Grab the Branch Number
        var selected = $('#branch-select').val().slice(7,11);
        var string = $('#branch-select').val();
        $('.message').html("");
        
        data = _.find(pageData.Items, function(obj){
            return obj.Data[0].Value == selected;
        });

        branchData.ID = data.Id;
        branchData.shortCode = _.find(data.Data, function(record){
            return record.Name == 'First Name';
        }).Value; 
        branchData.office = _.find(data.Data, function(record){
            return record.Name == 'Last Name';
        }).Value;
        branchData.phone = _.find(data.Data, function(record){
            return record.Name == 'Line1';
        }).Value;
        branchData.openHoursFrom = _.find(data.Data, function(record){
            return record.Name == 'OpenHoursFrom';
        }).Value;
        branchData.openHoursTo = _.find(data.Data, function(record){
            return record.Name == 'OpenHoursTo';
        }).Value;
        branchData.tempOpenHoursFrom = _.find(data.Data, function(record){
            return record.Name == 'TempOpenHoursFrom';
        }).Value;
        branchData.tempOpenHoursTo = _.find(data.Data, function(record){
            return record.Name == 'TempOpenHoursTo';
        }).Value;
        branchData.timeZone = _.find(data.Data, function(record){
            return record.Name == 'TimeZone';
        }).Value;
        branchData.backupNeeded = _.find(data.Data, function(record){
            return record.Name == 'TN Backup Needed';
        }).Value;
        branchData.backupNumber = _.find(data.Data, function(record){
            return record.Name == 'TN Backup Phone';
        }).Value;
        branchData.whosOnCall = _.find(data.Data, function(record){
            return record.Name == 'WhosOnCall';
        }).Value;
        branchData.useDST = _.find(data.Data, function(record){
            return record.Name == 'UseDST';
        }).Value;
        branchData.tempDateOpenTo = _.find(data.Data, function(record){
            return record.Name == 'TempOpenDateTo';
        }).Value;
        branchData.tempDateOpenFrom = _.find(data.Data, function(record){
            return record.Name == 'TempOpenDateFrom';
        }).Value;

        buildPage();

        setCookie('branch', string, 60);
    }

    function buildPage(){
        showSections();
        populateHeader();
        populateTimezone();
        populateOpenHours();
        populateTempDate();
        populateTempHours();
        populateWhoIsOnCall();
        populateTransferNumber();
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
        } else if (-4 < TZ || TZ < -10) {
            console.log('Error: Returned Time Zone is Outside Current Options');
        } 

        // Remove all the selected classes from the options
        var zones = $('#time-zone').find('option');
        zones.removeAttr('selected');
        
        var currentZone = 'option[value="' + TZ + '"]';
        $(currentZone).attr('selected', 'selected');

        $('#time-zone').find('.dropkick').dropkick();
        isDropkick = $('#time-zone').find('.dk-option-selected');
        if(isDropkick.length == 0){
            var toFind = 'option[value="' + TZ + '"]';
            $('#time-zone').find(toFind).attr('selected', 'selected');
    
        } else {
            var toFind = 'li[data-value="' + TZ + '"]';
            $('.dk-select-options').find(toFind).click();
        }

        // Configure DST Toggle
        // Default to DST if unset
        if(adjust == ""){
            adjust = "true";
        }

        if(adjust == "false" || adjust == "False" && status == "True" || status == "true"){
            $('#time-zone').find('.onoffswitch-checkbox').click();
        } else if (adjust == "true" || adjust == "True" && status == "false" || status == "False") {
            $('#time-zone').find('.onoffswitch-checkbox').click();
        }
    }

    // Configure the Open Hours to match the record
    function populateOpenHours(){
        // Get Both Times
        var oHourFrom = removeSeconds(branchData.openHoursFrom);
        var oHourTo = removeSeconds(branchData.openHoursTo);
        var context; 

        doDropkick($('#open-from'));
        doDropkick($('#open-to'));

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
    };

    // Configure the Temp Hour Date to match the record
    function populateTempDate(){
        var fromDate = new Date(branchData.tempDateOpenFrom);
        var toDate = new Date(branchData.tempDateOpenTo);
        var today = new Date();
        var pickers = $('.datepicker');


        // Initiate the Datepicker and Select Styling Plugins
        $(pickers[0]).pikaday({
            format: 'MM/DD/YYYY',
            minDate: today,
            defaultDate: fromDate,
            setDefaultDate: true,
            onSelect: function(){
                var date = document.createTextNode(this.getMoment().format('DD MM YYYY'))
                $('.selected').html(date);
            }
        });

        $(pickers[1]).pikaday({
            format: 'MM/DD/YYYY',
            minDate: today,
            defaultDate: toDate,
            setDefaultDate: true,
            onSelect: function(){
                var date = document.createTextNode(this.getMoment().format('DD MM YYYY'))
                $('.selected').html(date);
            }
        });
    }

    // Configure the Temp Hours to match the record
    function populateTempHours(){
        var tempHourFrom = removeSeconds(branchData.tempOpenHoursFrom);
        var tempHourTo = removeSeconds(branchData.tempOpenHoursTo);
        var fromDate = new Date(branchData.tempDateOpenFrom);
        var toDate = new Date(branchData.tempDateOpenTo);
        var context;

        doDropkick($('#temp-open-from'));
        doDropkick($('#temp-open-to'));

        // Are times populated? 
        if(tempHourFrom != "" && tempHourTo != ""){

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
                if(tempHourFrom == tempHourTo){
                    console.log('Temp Open Hours Time From must be earlier than Time To');
                    context = $('#temp-hours');
                    displayMsg(context, "Please Update Temporary Open Hours", true);
                }
            }
        } else {
            $('#temp-open-from').find('.dk-selected').html('0:00');
            $('#temp-open-to').find('.dk-selected').html('0:00');
            context = $('#temp-hours');
            displayMsg(context, "Please Update Temporary Open Hours", true);
        }   
    }

    // Configure Who is on Call
    function populateWhoIsOnCall(){
        var newNums= [];
        var nums = branchData.whosOnCall;

        nums = nums.split(",");
        $.each(nums, function(index,value){
            var newNum = formatPhoneNumber(value);
            newNums.push(newNum);
        });
        newNums = newNums.join(", ");

        if(9 < newNums.length){
            $('#call-list').val(newNums);
        } else {
            $('#call-list').val('');
        }
    }

    // Configure the Transfer Number to match the record
    function populateTransferNumber(){
        // debugger;
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

    // Unhide the sections after a branch load
    function showSections(){
        var sections = $('section');
        $.each(sections, function(index, value){
            var isHidden = $(this).hasClass('hidden');
            if(isHidden == true){
                $(this).removeClass('hidden');
            }
        })
    };

    // Make an ajax request to store a new branch record
    function updateContact(record, value, context){
        var status;

        $.ajax({
            url: apiURL + "api/contact/" + branchData.ID,
            type: "PUT",
            data: JSON.stringify([
                {Name: record, Value: value}                    
            ]),
            headers: {
                username: "contact@trueblue.com",
                password: "2532525995"
            }, 
            complete: function(){
                if(status == "success"){
                    displayMsg(context, 'Update Successful', false);
                } else {
                    displayMsg(context, 'Server Error: Please contact support@onereach.com', true);
                }
                loadPageData();
            },
            error: function(data, err, msg) {
                console.log(msg);
                status = "error";
            },
            success: function(data){
                // console.log(data);
                status = "success";
            }
        });
    }
          
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
            updateContact('OpenHoursFrom', fromHour + ":00", context);
            updateContact('OpenHoursTo', toHour + ":00", context);
        }
    };

    function updateTempHours(){
        var timeValidate;
        var context; 
        var fromAMPM; 
        var fromHour; 
        var toHour; 
        var toAMPM; 
        var newToDate;
        var newFromDate;
        var today = new Date();
        var picker;

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
        
        picker = context.find('.datepicker');
        newFromDate = $(picker[0]).val();
        newToDate = $(picker[1]).val();
        
        today = today.getFullYear() + "/" + today.getMonth() + "/" + today.getDate();

        if(newFromDate <= newToDate){
            // Convert to 24 Hour Format
            fromHour = formatTime(fromHour, fromAMPM);
            toHour = formatTime(toHour, toAMPM);

            if(newFromDate == newToDate){
                // Make sure from time is sooner than to time
                timeValidate = compareTime(fromHour, toHour);
            }
            
            // Throw Error if no date is selected
            if(newFromDate == "" || newToDate == ""){
                displayMsg(context, "Please select valid dates to set temporary open hours", true); 
            } else {
                // Throw Error If Time Don't Validate
                if(timeValidate == -1){
                    displayMsg(context, "Closing hour can not be before opening hour", true);
                } else if (
                    $('#temp-open-from').find('.dk-selected').html() == "0:00" ||
                    $('#temp-open-to').find('.dk-selected').html() == "0:00"
                ){
                    displayMsg(context, "Please select valid From and To times", true); 
                } else {
                    updateContact('TempOpenDateFrom', newFromDate, context);
                    updateContact('TempOpenDateTo', newToDate, context);
                    updateContact('TempOpenHoursFrom', fromHour + ":00", context);
                    updateContact('TempOpenHoursTo', toHour + ":00", context);
                }
            }        
        } else {
            displayMsg(context, "From Date cannot precede To Date", true);     
        }
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
                    if(flag == -1){
                        displayMsg(context, "Please enter ten digit numbers separated by commas", true);
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

function formatPhoneNumber(number){
    number = "(" + number.slice(0,3) + ") " + number.slice(3,6) + "-" + number.slice(6,10);
    return number;
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

function populateTimeSelects(){
    // Populate the Time Selects
    var hourInput = $('.12-hour');
    $.each(hourInput, function(index, value) {
        $(this).attr('populated', 'true');
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

// Remove the seconds from a returned time
function removeSeconds(time){
    var timeArr = time.split(":");
    if (timeArr.length == 3){
        time = timeArr[0] + ":" + timeArr[1];
    } 

    return time;
}

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

function validateNumber(number){
    number = parseInt(number.toString().replace(/\D/g, ''));
    // console.log(number);
    isNumber = isNaN(number);
    // console.log(isNumber);

    if(number.toString().split("").length != 10){
        return -1;
    } else if (isNumber == true) {
        return -1;
    } else {
        return number;
    }
};

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
    }
    return "";
}

