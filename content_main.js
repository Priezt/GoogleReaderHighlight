var keyword_list = [];
var color_list = ['#F88', '#0F8', '#08F', '#F8F', '#F00', '#F84', '#088', '#88F', '#880'];
var current_color_index = 0;
var color_map = {};

$(init);

function init(){
	console.log("GoogleReaderHighlight init");
	inject_css();
	inject_controller();
	load_keyword_list();
	bind_events();
}

function parse_keyword_list(str){
	keyword_list = str.split(/[ ,\r\n]+/);
	keyword_list.sort(function(a,b){
		if(a.length > b.length){
			return 1;
		}else if(a.length < b.length){
			return -1;
		}else{
			return 0;
		}
	});
	console.log("total: " + keyword_list.length);
	console.log(keyword_list.join(","));
}

function load_keyword_list(){
	console.log("load_keyword_list");
	if(localStorage['highlight_keyword_list']){
		parse_keyword_list(localStorage['highlight_keyword_list']);
		$("#keyword_list_text").val(localStorage['highlight_keyword_list']);
	}else{
		$("#keyword_list_text").val("");
	}
}

function update_keyword_list(){
	console.log("update_keyword_list");
	var keyword_list_str = $("#keyword_list_text").val();
	parse_keyword_list(keyword_list_str);
	localStorage["highlight_keyword_list"] = keyword_list_str;
	$("#highlight_keyword_panel").hide();
}

function save_keyword_list_to_cloud(){
	$.post("http://priezttest.appspot.com/", {
		k: 'google_reader_highlight_cloud',
		v: JSON.stringify($("#keyword_list_text").val())
	}, function(data){
		var result = JSON.parse(data);
		console.log(result);
		if(result.error){
			console.log('not login');
			console.log('login url: ' + result.login_url);
			console.log('login');
			$.post("http://priezttest.appspot.com/", {
				k: 'google_reader_highlight_cloud',
				v: JSON.stringify($("#keyword_list_text").val())
			}, function(data){
				console.log('save complete');
				$("#grh_msg").text("Done");
			});
		}else{
			console.log('save complete');
			$("#grh_msg").text("Done");
		}
	});
}

function load_keyword_list_from_cloud(){
	$.get("http://priezttest.appspot.com/?k=google_reader_highlight_cloud", function(data){
		var result = JSON.parse(data);
		if(result.error){
			console.log('not login');
			console.log('login url: ' + result.login_url);
			$.get(result.login_url, function(data){
				console.log('login');
				$.get("http://priezttest.appspot.com/?k=google_reader_highlight_cloud", function(data){
					var result = JSON.parse(data);
					console.log(result);
					$("#keyword_list_text").val(JSON.parse(result.data));
					console.log('load complete');
					$("#grh_msg").text("Done");
				});
			});
		}else{
			console.log(result);
			$("#keyword_list_text").val(JSON.parse(result.data));
			console.log('load complete');
			$("#grh_msg").text("Done");
		}
	});
}

function inject_controller(){
	console.log("inject controller");
	$("div#search").append(
		$("<div></div>")
			.attr("id", "highlight_button")
			.addClass("goog-inline-block")
			.addClass("jfk-button")
			.addClass("jfk-button-action")
			.text("Highlight")
	).append(
		$("<div></div>")
		.addClass('goog-inline-block')
		.addClass('jfk-button')
		.addClass('jfk-button-standard')
		.addClass('jfk-button-narrow')
		.append(
			$("<img>")
			.addClass("jfk-button-img")
			.attr("src", $("div#entries-down img").attr("src"))
		)
		.click(function(){
			$("#grh_msg").text("");
			$("#highlight_keyword_panel").toggle();
		})
	);
	$("<div></div>")
		.attr("id", "highlight_keyword_panel")
		.append(
			$("<textarea></textarea>")
				.attr("id", "keyword_list_text")
				.css("width", "100%")
				.attr("rows", "10")
		)
		.append(
			$("<span></span>")
				.addClass("jfk-button-primary")
				.addClass("jfk-button")
				.css("-webkit-user-select", "none")
				.text("Local Update")
				.click(update_keyword_list)
		)
		.append(
			$("<span></span>")
				.addClass("jfk-button-primary")
				.addClass("jfk-button")
				.css("-webkit-user-select", "none")
				.text("Cloud Save")
				.click(save_keyword_list_to_cloud)
		)
		.append(
			$("<span></span>")
				.addClass("jfk-button-primary")
				.addClass("jfk-button")
				.css("-webkit-user-select", "none")
				.text("Cloud Load")
				.click(load_keyword_list_from_cloud)
		)
		.append(
			$("<div>")
				.attr("id", "grh_msg")
				.css("display", "inline-block")
				.css("font-weight", "bold")
				.css("color", "#8C8")
				.text("")
		)
		.hide()
		.insertBefore($("div#main"));
}

function bind_events(){
	$("div#highlight_button").click(function(){
		render_entries();
		$("#entries").bind('DOMNodeInserted', render_entries);
	});
}

function render_entries(){
	var unread_entries = $("div.entry").not(".read");
	console.log("unread entries: " + unread_entries.size());
	unread_entries.find("div.collapsed .entry-title").not(".highlight_processed").each(function(){
		$(this).addClass("highlight_processed");
		var text = $(this).text();
		var html = render_html(text);
		$(this).html(html);
		$(this).find(".highlighted_word").hover(keyword_hover_in, keyword_hover_out);
	});
}

function keyword_hover_in(){
	//var keyword_id = $(this).attr("keyword_id");
	//console.log("keyword_id: " + keyword_id);
}

function keyword_hover_out(){
}

function get_new_color(){
	var new_color = color_list[current_color_index];
	current_color_index++;
	if(current_color_index >= color_list.length){
		current_color_index = 0;
	}
	return new_color;
}

function render_html(html){
	//console.log("render: " + html);
	for(var i=0;i<keyword_list.length;i++){
		var k = keyword_list[i];
		if(k.length == 0){
			continue;
		}
		if(/^#/.exec(k)){
			continue;
		}
		//console.log("match: " + k);
		if(html.indexOf(k) >= 0){
			//console.log("match: "+k+" -> "+html);
			if(! color_map[k]){
				color_map[k] = get_new_color();
			}
			html = html.replace(new RegExp(k, 'gm'), "<div class=\"highlighted_word\" keyword_id=\"keyword_"+md5(k).substring(0, 8)+"\" style=\"background-color:"+color_map[k]+";\">"+k+"</div>");
		}
	}
	return html;
}

function inject_css(){
	console.log("inject css");
	$("head").append(content_css.getString());
}
