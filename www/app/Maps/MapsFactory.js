angular.module('sequor')


.factory('MapsFactory', function($cordovaLaunchNavigator) {

    return {
        getNextEvent: getNextEvent,
        navigate: navigate
    }

    //empty variable to hold next task from database
    var nextThing;

    //variable to hold current time string ie. "08"
    var currentTime;

    //get today's date
    //check for tasks that match today's date
    //clear the task message
    //get only the tasks that tart later today
    //call testFunction()
    function getNextEvent() {
        var date = new Date().toDateString();
        var tasksMessage = document.getElementById('task-message');
        tasksMessage.innerHTML = '';
        currentTime = new Date().toTimeString().substr(0, 2);
        var thishourkey = parseInt(currentTime);
        var nextTask = new Parse.Query('Task');
        nextTask.equalTo('user', Parse.User.current());
        nextTask.equalTo('startsAtDate', date);
        nextTask.greaterThanOrEqualTo('hourkey', thishourkey);
        nextTask.find({
            success: function(stuffs) {
                var tasksMessage = document.getElementById('task-message');
                if (stuffs.length == 0) {
                    tasksMessage.innerHTML += "no pending events";
                } else {
                    testFunction(stuffs);
                }
            },
            error: function(err) {
                console.log(err);
            }
        })
    }

    //if there is more than one task, make a temporary array
    //sort the array by start time
    //grab the first one from the array, the one that should come next chronologically
    //check how many hours/minutes until the next task, display that in the task-message div
    //call getDirections()
    function testFunction(stuff) {
        var tempArray = [];
        for (var i = 0; i < stuff.length; i++) {
            var starthour = stuff[i].get("starthour");
            var start = parseInt(starthour.substr(0, starthour.indexOf(':')));
            var ampm = starthour.substr(starthour.indexOf(':') + 4, 2);
            var newstart;

            if (starthour == "noon" || starthour == "12:30 pm") {
                newstart = 12;
            } else if (ampm == "pm") {
                newstart = start + 12;
            } else {
                newstart = start;
            }

            tempArray.push({
                "starthour": newstart,
                "startminute": parseInt(starthour.substr(starthour.indexOf(':') + 1, 2)),
                "address": stuff[i].get("address"),
                "eventname": stuff[i].get("eventname")
            });
        }
        tempArray.sort(function(a, b) {
            return a.starthour - b.starthour
        });
        var tasksMessage = document.getElementById('task-message');
        var newCurrentTime = new Date().toTimeString();
        var thisHour = parseInt(newCurrentTime.substr(0, 2));
        var thisMinute = parseInt(newCurrentTime.substr(3, 2));
        if (tempArray[0].starthour === thisHour && tempArray[0].startminute < thisMinute) {
            nextThing = tempArray[1];
        } else {
            nextThing = tempArray[0];
        }
        var hour = nextThing.starthour;
        var minute = nextThing.startminute;

        var insertMinute;

        if (hour == thisHour && minute > thisMinute) {
            insertMinute = minute - thisMinute;
            tasksMessage.innerHTML += "<b>Next Task:</b> " + nextThing.eventname + "<br>" + "<b>Starts In:</b> " + insertMinute + " minutes";
            getDirections();
        } else if (hour == thisHour + 1 && minute >= thisMinute) {
            insertMinute = minute - thisMinute;
            tasksMessage.innerHTML += "<b>Next Task:</b> " + nextThing.eventname + "<br>" + "<b>Starts In:</b> 1 hour and " + insertMinute + " minutes";
            getDirections();
        } else if (hour == thisHour + 1 && minute < thisMinute) {
            insertMinute = 60 - thisMinute + minute;
            tasksMessage.innerHTML += "<b>Next Task:</b> " + nextThing.eventname + "<br>" + "<b>Starts In:</b> " + insertMinute + " minutes";
            getDirections();
        } else if (hour == thisHour + 2 && minute < thisMinute) {
            insertMinute = 60 - thisMinute + minute;
            tasksMessage.innerHTML += "<b>Next Task:</b> " + nextThing.eventname + "<br>" + "<b>Starts In:</b> 1 hour and " + insertMinute + " minutes";
            getDirections();
        } else if (hour > thisHour && minute < thisMinute) {
            var insertHours = hour - thisHour - 1;
            insertMinute = 60 - thisMinute + minute;
            tasksMessage.innerHTML += "<b>Next Task:</b> " + nextThing.eventname + "<br>" + "<b>Starts In:</b> " + insertHours + " hours and " + insertMinute + " minutes";
            getDirections();
        } else {
            var insertHours = hour - thisHour;
            insertMinute = minute - thisMinute;
            tasksMessage.innerHTML += "<b>Next Task:</b> " + nextThing.eventname + "<br>" + "<b>Starts In:</b> " + insertHours + " hours and " + insertMinute + " minutes";
            getDirections();
        }
    }

    //middle man
    //call calculateAndDisplayRoute()
    function getDirections() {

        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = new google.maps.DirectionsRenderer;

        calculateAndDisplayRoute(directionsService, directionsDisplay);

    }

    //get the user's current location
    //calculate how long it will take to get from user's current location to next task
    //display that value in the directions-panel
    function calculateAndDisplayRoute(directionsService, directionsDisplay) {

        Parse.GeoPoint.current({
            success: function(position) {
                initialLocation = new google.maps.LatLng(position._latitude, position._longitude);
                directionsService.route({
                    origin: initialLocation,
                    destination: nextThing.address,
                    drivingOptions: {
                        departureTime: new Date(),
                        trafficModel: google.maps.TrafficModel.PESSIMISTIC
                    },
                    travelMode: google.maps.TravelMode.DRIVING
                }, function(response, status) {
                    if (status === google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                        var route = response.routes[0];
                        var taskMessage = document.getElementById('task-message');
                        for (var i = 0; i < route.legs.length; i++) {
                            taskMessage.innerHTML += '<br>' + '<span><b>Travel time:</b> ' + route.legs[i].duration.text;
                        }
                    } else {
                        window.alert('Directions request failed due to ' + status);
                    }
                });
            },
            error: function(err) {
                console.log(err);
            }
        })

    }


    // Navigation
    function navigate() {
        Parse.GeoPoint.current({
            success: function(position) {
                $cordovaLaunchNavigator.navigate(nextThing.address, {
                    start: [position._latitude, position._longitude],
                    enableDebug: true
                }).then(function() {
                    alert("Navigator Launched");
                }, function(err) {
                    alert(err);
                });
            },
            error: function(err) {
                console.log("couldn't get position");
            }
        })

    }

})
