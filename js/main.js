$(document).ready(function(){
	if($('.select')){
		$('select').dropkick();
	}

	$('.accordion-toggle').on('click', function(e){
		e.preventDefault();
		$(this).find('.arrow').toggleClass('down').toggleClass('up');
		$(this).siblings('.accordion-body').toggleClass('open');
	});

	$('.key').on('click', function(e){
		e.preventDefault();
		$(this).closest('section').toggleClass('lock').toggleClass('unlock');
	});
});