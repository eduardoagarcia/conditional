// recursive descent parser
// https://github.com/stevecooperorg/canto34
// http://vateam.convio.net/site/PageNavigator/conditional_tester.html

// debug shortcut
function debug(x) {
    console.log(x);
}


// print conditional
function printConditional(conditional, clear) {
    // show our results container
    $('#resultsContainer').removeClass('hidden');
    // get our stack results container
    var $results = $('#conditionalResults');
    // clear our results column
    if (clear != undefined) {
        if (clear == true) {
            $results.html('');
        }
    }
    // print our conditional
    $results.append('<pre>' + conditional + '</pre>');
}


// print error
function printError(errorText) {
    // show our results container
    $('#resultsContainer').removeClass('hidden');
    // get our stack results container
    var $results = $('#conditionalResults');
    // print our error
    $results.append('<pre class="text-danger"><strong>ERROR: ' + errorText + '</strong></pre>');
}


// regex escape
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


// trim whitespace
function trimWhiteSpace(string) {
    // trim extra whitespaces
    string = string.replace(/\n/g, '%%%%%');
    string = string.replace(/^\s*/gm, '');
    string = string.replace(/\s*$/gm, '');
    string = string.replace(/\s+/g, ' ');
    return string;
}


// transform conditional to make it parse worthy
function tidyConditional(conditional) {
    // remove spaces from parentheses
    conditional = conditional.replace(/\s*\(\s*/g, '(');
    conditional = conditional.replace(/\s*\)\s*/g, ')');
    // add necessary spaces
    var replace_terms = ['if', 'else', '{', '}', '>', '<', '>=', '<=', '==', '!=', '||', '&&', '*', '^', '$'];
    // * => contains
    // ^ => starts with
    // $ => ends with
    $.each(replace_terms, function(index, value){
        re_value = escapeRegExp(value);
        var re = new RegExp(re_value, 'g');
        conditional = conditional.replace(re, ' ' + value + ' ');
    });
    // fix '< =' and '> ='
    conditional = conditional.replace('< =', '<=');
    conditional = conditional.replace('> =', '>=');
    // trim white space
    conditional = trimWhiteSpace(conditional);
    // return pretty conditional
    return conditional;
}


// format/pretty conditional
function pretty(string) {

    // our final string we will return
    var final_string = '';

    // replace %%%%% with \n to keep formatting
    string = string.replace(/%%%%%/g, '\n');

    // go through each line to format
    var lines = string.split('\n');
    var indent = 0;
    $.each(lines, function(index, value){
        // trim each line
        value = value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        // our indent string
        var indent_string = '';
        // does previous line have a :: or a ]]?
        if (lines[index-1] != undefined) {
            var last_two = lines[index-1].slice(-2);
            if (last_two == '::') {
                indent = indent + 1;
            } else if ((last_two == ']]') && (indent > 0)) {
                indent = indent - 1;
            }
        }
        // are we a :: or ]]?
        if ((value == ']]') || (value == '::') || (value == '::]]')) {
            if ((last_two != ']]') && (indent > 0)) {
                indent = indent - 1;
            }
        }
        // calculate our indents
        for (var i=0; i<indent; i++) {
            for (var j=0; j<4; j++) {
                indent_string = indent_string + ' ';
            };
        }
        // space apart our conditional groups
        if (((value == '::]]') || (value == ']]')) && (indent == 0)) {
            value = value + '\n\n';
        }
        // add our line onto the final string
        final_string = final_string + indent_string + value + '\n';
    });

    // return our final string
    return final_string;
}


// group conditionals
function group(conditional) {

    // groups array
    var groups = [];

    // tidy our conditional
    conditional = tidyConditional(conditional);

    // gather each group
    var conditional_terms = conditional.match(/(\w|\+|\-|\*|\/|\&|\<|\>|\!|\?|\||\=|\.|\'|\:|\/|}|{|\(|\))+|"[^"]+"/g);

    // flags/counters
    var first_bracket = false;
    var first_if = false;
    var else_found = false;
    var capturing = false;
    var brackets = 0;
    var placement = 0;
    var s_char = 0;
    var e_char = 0;

    // parse each term
    $.each(conditional_terms, function(i, v) {

        // start our conditional capture
        if (!first_if) {
            if (v == 'if') {
                placement = conditional.indexOf(v, placement);
                s_char = placement;
                first_if = true;
                capturing = true;
            }
        }

        // make sure we are capturing our group
        if (capturing) {
            // we are a {
            if (v == '{') {
                placement = conditional.indexOf(v, placement) + v.length;
                brackets = brackets + 1;
                first_bracket = true;
            }
            // we are a }
            if (v == '}') {
                placement = conditional.indexOf(v, placement) + v.length;
                brackets = brackets - 1;
            }
            // we found our closing bracket
            if (first_bracket) {
                if (brackets === 0) {
                    // are we followed by an else?
                    if (conditional_terms[i+1] == 'else') {
                        placement = conditional.indexOf(conditional_terms[i+1], placement) + conditional_terms[i+1].length;
                        first_bracket = false;
                    } else {
                        e_char = placement;
                        // reset
                        capturing = false;
                        first_bracket = false;
                        first_if = false;
                        else_found = false;
                    }
                }
            }
        }
        // end of capturing

        // append the new conditional group
        if (!capturing) {
            groups.push(conditional.substring(s_char, e_char));
        }

    });

    // return our groups
    return groups;

}


// find our matching closing bracket
function findClosingBracket(str, s, open_match, close_match) {
    var str_array = str.split('');
    var brackets = 1;
    var closing_bracket = 0;
    $.each(str_array, function(index, value){
        if (index >= s) {
            // we found {
            if (value == open_match) {
                brackets = brackets + 1;
            }
            // we found }
            if (value == close_match) {
                brackets = brackets - 1;
            }
            // we found our last bracket
            if (brackets === 0) {
                closing_bracket = index;
                return false;
            }
        }
    });
    return closing_bracket;
}


// get the content of the group
// return: conditional, if content, else content
function parseGroup(group) {

    var group_logic = '';
    var group_if_content = '';
    var group_else_content = '';

    // get our group logic
    var c = group.match(/(?:else|if)\s*\(*(.*)\)*\s*{/gi);
    if (c != null) {
        var s = c[0].indexOf('if') + 2;
        var e = c[0].indexOf('{');
        group_logic = tidyConditional(c[0].substring(s, e));

        // get our group content
        var s = e + 1;
        var e = findClosingBracket(group, s, '{', '}');
        group_if_content = tidyConditional(group.substring(s, e));

        // get our group else content, if we have an else
        var s = e + 1;
        if ((group.indexOf('else', s)-s) == 1) {
            var s = group.indexOf('{', s) + 1;
            var e = findClosingBracket(group, s, '{', '}');
            group_else_content = tidyConditional(group.substring(s, e));
        } else {
            group_else_content = '';
        }
    }

    // return our parsed pieces of the group
    return {
        'group_logic': group_logic,
        'group_if_content': group_if_content,
        'group_else_content': group_else_content
    };

}


// build our groups
function buildGroups(input) {

    // our return value
    var group_array = [];

    // separate our conditionals into groups
    var groups = group(input);
    
    // process each conditional group
    $.each(groups, function(index, group){
        
        // parse our group
        var parsed_group = parseGroup(group);

        // conditionalize our logic
        parsed_group.group_logic = conditionalize(parsed_group.group_logic);

        // logicize our logic 
        parsed_group.group_logic = groupParens(parsed_group.group_logic, parsed_group.group_logic);

        // wrap in logic stuffs if we haven't already
        if (parsed_group.group_logic.indexOf('x1x::x') != 0) {
            parsed_group.group_logic = 'x1x::x' + parsed_group.group_logic + 'x';
        }

        // replace ~~~~~ with || due to || being reserved
        parsed_group.group_logic = parsed_group.group_logic.replace(/~~~~~/g, '||');

        // parse group_if_content
        if (parsed_group.group_if_content.indexOf('if') != -1) {
            parsed_group.group_if_content = '\n' + buildGroups(parsed_group.group_if_content);
        }

        // parse group_else_content
        if (parsed_group.group_else_content.indexOf('if') != -1) {
            parsed_group.group_else_content = '\n' + buildGroups(parsed_group.group_else_content);
        }

        // build the final logic
        logic_string = '[[?' + parsed_group.group_logic + '::' + parsed_group.group_if_content + '::' + parsed_group.group_else_content + ']]';

        // add the logic string to the group_array
        if (logic_string != '[[?x1x::xx::::]]') {
            // add it to our group array
            group_array.push(logic_string);
        }

    });

    // lump our groups together
    var lump = '';
    $.each(group_array, function(index, value){
        lump = lump + value + '\n';
    });

    // return final lump
    return lump;
}


// run build conditional
function run() {
    // erase old conditionals
    $('#conditionalResults').html('');
    // grab our conditional
    var input_value = $('#conditionalInput').val();
    // make sure we are not empty
    if (input_value !== '') {
        // errors will happy with improper logic imput
        try {
            // get our logic
            var final_logic = buildGroups(input_value);
            // did we get a result?
            if (final_logic != '') {
                // pretty our final logic string
                final_logic = pretty(final_logic);
                // print our logic
                printConditional(final_logic);
            } else {
                printError('You have an error in your conditional.');
            }
        } catch(error) {
            printError('You have an error in your syntax.');
        }
    }
} // end of run


// conditionalize our logic
// samples:
//     '1 > 2' => '[[E130: 1 2 >]]'
//     'a == b' => '[[?xax::xbx::1::0]]'
//     '[[S1:first_name]] != [[S1:last_name]]' => '[[?x[[S1:first_name]]x::x[[S1:last_name]]x::0::1]]'
function conditionalize(string) {
    
    // define our conditional expression lexer
    var lexer = new canto34.Lexer();

    // bring in some predefined types for opening and closing parens ( )
    var types = canto34.StandardTokenTypes;
    lexer.addTokenType(types.openParen());
    lexer.addTokenType(types.closeParen());

    // add a token for whitespace
    lexer.addTokenType({ 
        name: "ws",       // give it a name
        regexp: /[\s\t]+/, // match spaces and tabs
        ignore: true      // don't return this token in the result
    });

    // add a token type for our logical operators
    // || &&
    lexer.addTokenType({
        name: "logical",
        regexp: /^(\|\|){1}|(\&\&){1}/
    });

    // add a token type for our comparison operators
    // > >= < <= == != * ^ $
    lexer.addTokenType({
        name: "comparison",
        regexp: /^(\>\=){1}|(\<\=){1}|(\>){1}|(\<){1}|(\=\=){1}|(\!\=){1}|(\*){1}|(\^){1}|(\$){1}/
    });

    // add a token type for our constants
    lexer.addTokenType({
        name: "constant",
        regexp: /^[a-zA-Z0-9\[\]\-\:\_\"\'\.\/]+/
    });

    // grab our tokens
    var tokens = lexer.tokenize(string);

    // initialize the parser
    var parser = new canto34.Parser();
    parser.initialize(tokens);

    // conditionalize logic parser
    parser.logic = function(string) {
        var results = [];
        var tokens = this.tokens;
        $.each(this.tokens, function(index, value){
            // grab each logic comparison
            if (value.type == 'comparison') {
                // get our slice start/end points
                s = tokens[index-1].character - 1;
                e = (tokens[index+1].character - 1) + tokens[index+1].content.length;
                // build our comparisons  ----  > >= < <= == != * ^ $
                switch(value.content) {
            
                    // greater than (returns 1 for true, 0 for false)
                    case '>':
                        if ((tokens[index-1].type == 'constant') && (tokens[index+1].type == 'constant')) {
                            luminateOperation = '[[E130: ' + tokens[index-1].content + ' ' + tokens[index+1].content + ' >]]';
                        } else {
                            // error
                        }
                        break;
                    
                    // greater than or equal to (returns 1 for true, 0 for false)
                    case '>=':
                        if ((tokens[index-1].type == 'constant') && (tokens[index+1].type == 'constant')) {
                            luminateOperation = '[[E130: ' + tokens[index-1].content + ' ' + tokens[index+1].content + ' > ' + tokens[index-1].content + ' ' + tokens[index+1].content + ' == ~~~~~]]';
                        } else {
                            // error
                        }
                        break;

                    // less than (returns 1 for true, 0 for false)
                    case '<':
                        if ((tokens[index-1].type == 'constant') && (tokens[index+1].type == 'constant')) {
                            luminateOperation = '[[E130: ' + tokens[index-1].content + ' ' + tokens[index+1].content + ' <]]';
                        } else {
                            // error
                        }
                        break;

                    // less than or equal to (returns 1 for true, 0 for false)
                    case '<=':
                        if ((tokens[index-1].type == 'constant') && (tokens[index+1].type == 'constant')) {
                            luminateOperation = '[[E130: ' + tokens[index-1].content + ' ' + tokens[index+1].content + ' < ' + tokens[index-1].content + ' ' + tokens[index+1].content + ' == ~~~~~]]';
                        } else {
                            // error
                        }
                        break;

                    // equals (returns 1 for true, 0 for false)
                    case '==':
                        if ((tokens[index-1].type == 'constant') && (tokens[index+1].type == 'constant')) {
                            luminateOperation = '[[?x' + tokens[index-1].content + 'x::x' + tokens[index+1].content + 'x::1::0]]';
                        } else {
                            // error
                        }
                        break;

                    // not equals (returns 1 for true, 0 for false)
                    case '!=':
                        if ((tokens[index-1].type == 'constant') && (tokens[index+1].type == 'constant')) {
                            luminateOperation = '[[?x' + tokens[index-1].content + 'x::x' + tokens[index+1].content + 'x::0::1]]';
                        } else {
                            // error
                        }
                        break;

                    // contains (returns 1 for true, 0 for false)
                    case '*':
                        if ((tokens[index-1].type == 'constant') && (tokens[index+1].type == 'constant')) {
                            luminateOperation = '[[?' + tokens[index-1].content + '::' + tokens[index+1].content + '::1::0]]';
                        } else {
                            // error
                        }
                        break;

                    // starts with (returns 1 for true, 0 for false)
                    case '^':
                        if ((tokens[index-1].type == 'constant') && (tokens[index+1].type == 'constant')) {
                            luminateOperation = '[[E130: ' + tokens[index-1].content + ' ' + tokens[index+1].content + ' indexof 0 ==]]';
                        } else {
                            // error
                        }
                        break;

                    // ends with (returns 1 for true, 0 for false)
                    case '$':
                        if ((tokens[index-1].type == 'constant') && (tokens[index+1].type == 'constant')) {
                            // test est lastindexof test length est length - ==
                            luminateOperation = '[[E130: ' + tokens[index-1].content + ' ' + tokens[index+1].content + ' lastindexof ' + tokens[index-1].content + ' length ' + tokens[index+1].content + ' length - ==]]';
                        } else {
                            // error
                        }
                        break;
                    
                    // do nothing
                    default:

                }

                // build what to find/replace
                find = {
                    'find': string.slice(s, e),
                    'replace': luminateOperation
                };
                results.push(find);
                
            }
        });
        
        // replace our string
        $.each(results, function(index, value){
            string = string.replace(value.find, value.replace);
        });

        // return the string
        return string;
    }; // end of logic parser

    // run the parser
    string = stripUnnecessaryParens(parser.logic(string));

    // return our string
    return string;
} // end conditionalize


function stripUnnecessaryParens(string) {

    // define our sub conditional expression lexer
    var lexer = new canto34.Lexer();

    // bring in some predefined types for opening and closing parens ( )
    var types = canto34.StandardTokenTypes;
    lexer.addTokenType(types.openParen());
    lexer.addTokenType(types.closeParen());

    // add a token for whitespace
    lexer.addTokenType({
        name: "ws",       // give it a name
        regexp: /[\s\t]+/, // match spaces and tabs
        ignore: true      // don't return this token in the result
    });

    // add a token type for our logical operators
    // || &&
    lexer.addTokenType({
        name: "logical",
        regexp: /^(\|\|){1}|(\&\&){1}/
    });

    // add a token type for our conditionals [\[[a-zA-Z_:0-9\?\<\>\s\]\[\=\-\|]+\]\]
    lexer.addTokenType({
        name: "conditional",
        regexp: /\[\[[a-zA-Z_:0-9\?\<\>\s\]\[\=\-\"\'\.\/\~]+\]\]/
    });

    // grab our tokens
    var tokens = lexer.tokenize(string);

    // initialize the parser
    var parser = new canto34.Parser();
    parser.initialize(tokens);

    // conditionalize parser
    parser.conditional = function(string) {
        var paren_clean_results = [];
        var tokens = this.tokens;
        $.each(this.tokens, function(index, value){
            // do we have a comparison
            if (value.type == 'conditional') {
                if (tokens[index-1] != undefined) {
                    // work with the conditional
                    if ((tokens[index-1].type == 'open paren') && (tokens[index+1].type == 'close paren')) {
                        s = tokens[index-1].character-1;
                        e = tokens[index+1].character;
                        // build what to find/replace
                        find = {
                            'find': string.slice(s, e),
                            'replace': ' ' + value.content + ' '
                        };
                        paren_clean_results.push(find);
                    }
                }
            }
        });

        // clean unneeded parens in our
        $.each(paren_clean_results, function(index, value){
            string = string.replace(value.find, value.replace);
        });

        // return the string
        return trimWhiteSpace(string);

    }; // end of conditional parser

    // run the parser
    string = parser.conditional(string);

    return string;

} // end strip unnecessary parens


// group parens
function groupParens(string, original_string) {
    // find any groups of parens
    var groups = [];
    var s = 0;
    var e = 0;
    // see if we have any stranded logicals, if we do, wrap them
    var stranded = findStrandedLogicals(original_string);
    if (stranded) {
        string = '( ' + string + ' )';
        original_string = '( ' + original_string + ' )';
    }
    // find each of the paren groups at this level
    while (s != -1) {
        s = string.indexOf('(', s);
        // do we have any parens?
        if (s != -1) {
            // we have parens
            s++;
            e = findClosingBracket(string, s, '(', ')');
            temp = {
                complete: trimWhiteSpace(string.substring(s-1, e+1)),
                inside: trimWhiteSpace(string.substring(s, e))
            };
            groups.push(temp);
            s = e;
        } else if (e+1 < string.length) {
            // we don't have parens
            temp = {
                complete: string,
                inside: string
            };
            groups.push(temp);
        }
    }
    // go through each paren group to evaluate further
    $.each(groups, function(index, value){
        var logicized = '';
        // when do we logicize?
        if (value.inside == value.complete) {
            logicized = logicize(string);
        } else {
            // we have no more parens
            if (value.inside.indexOf('(') == -1) {
                logicized = '[[?' + logicize(value.inside) + '::1::0]]';
            } else {
                // down the rabit hole
                original_string = groupParens(value.inside, original_string);
                // do we still have parens?
                if (original_string.indexOf('(') != -1) {
                    // further down the rabit hole
                    original_string = groupParens(original_string, original_string);
                }
            }
        }
        // replace
        if (logicized !== '') {
            original_string = original_string.replace(value.complete, logicized);
        }
    });
    // return final result
    return original_string;
}


// function to build logical groupings of conditionals
function logicize(string) {

    // define our logical lexer
    var lexer = new canto34.Lexer();

    // bring in some predefined types for opening and closing parens ( )
    var types = canto34.StandardTokenTypes;
    lexer.addTokenType(types.openParen());
    lexer.addTokenType(types.closeParen());

    // add a token for whitespace
    lexer.addTokenType({
        name: "ws",       // give it a name
        regexp: /[\s\t]+/, // match spaces and tabs
        ignore: true      // don't return this token in the result
    });

    // add a token type for our logical operators
    // || &&
    lexer.addTokenType({
        name: "logical",
        regexp: /^(\|\|){1}|(\&\&){1}/
    });

    // add a token type for our conditionals [\[[a-zA-Z_:0-9?<>\s\]\[\=\-]+\]\]
    lexer.addTokenType({
        name: "conditional",
        regexp: /\[\[[a-zA-Z_:0-9\?\<\>\s\]\[\=\-\"\'\.\/\~]+\]\]/
    });

    // grab our tokens
    var tokens = lexer.tokenize(string);

    // initialize the parser
    var parser = new canto34.Parser();
    parser.initialize(tokens);

    // logicals parser
    parser.logicals = function(string) {
        var tokens = this.tokens;
        var logical_found = false;
        var final_compare = '';
        var final_logical = '';
        var used = [];
        var kind = undefined;
        $.each(this.tokens, function(index, value){
            // we have ourselves a logical
            if (value.type == 'logical') {
                logical_found = true;
                if (kind === undefined) {
                    kind = value.content;
                    if (kind == '&&') {
                        final_compare = 'x';
                        final_logical = 'x';
                    }
                }
                if (kind == value.content) {
                    if (kind == '&&') {
                        if (used.indexOf(index-1) == -1) {
                            final_compare = final_compare + '1';
                            final_logical = final_logical + tokens[index-1].content;
                            used.push(index-1);
                        }
                        if (used.indexOf(index+1) == -1) {
                            final_compare = final_compare + '1';
                            final_logical = final_logical + tokens[index+1].content;
                            used.push(index+1);
                        }
                    } else {
                        if (used.indexOf(index-1) == -1) {
                            final_logical = final_logical + tokens[index-1].content;
                            used.push(index-1);
                        }
                        if (used.indexOf(index+1) == -1) {
                            final_logical = final_logical + tokens[index+1].content;
                            used.push(index+1);
                        }
                        final_compare = '1';
                    }
                }
            }
        });

        if (logical_found === false) {
            // if we don't have a logical present
            string = 'x1x::x' + string + 'x';
        } else {
            // we do have at least one logical present
            if (kind == '&&') {
                var close_compare = 'x';
            } else {
                var close_compare = '';
            }
            // build final
            string = final_logical + close_compare + '::' + final_compare + close_compare;
        }

        // return the string
        return trimWhiteSpace(string);

    } // end of conditional parser

    // run the parser
    string = parser.logicals(string);

    // return the string
    return string;
}


// function to find stranded logicals
function findStrandedLogicals(string) {

    // define our logical lexer
    var lexer = new canto34.Lexer();

    // add a token for whitespace
    lexer.addTokenType({
        name: "ws",       // give it a name
        regexp: /[\s\t]+/, // match spaces and tabs
        ignore: true      // don't return this token in the result
    });

    // add a token type for our logical operators
    // || &&
    lexer.addTokenType({
        name: "logical",
        regexp: /^(\|\|){1}|(\&\&){1}/
    });

    // add a token type for our conditionals [\[[a-zA-Z_:0-9?<>\s\]\[\=\-]+\]\]
    lexer.addTokenType({
        name: "conditional",
        regexp: /\[\[[a-zA-Z_:0-9\?\<\>\s\]\[\=\-\"\'\.\/\~]+\]\]/
    });

    // add a token type for our conditional groups surrounded by parens
    lexer.addTokenType({
        name: "groups",
        regexp: /\(.+\)/
    });    

    // grab our tokens
    var tokens = lexer.tokenize(string);

    // initialize the parser
    var parser = new canto34.Parser();
    parser.initialize(tokens);

    // stranded
    parser.stranded = function(string) {
        var tokens = this.tokens;
        var stranded_logical = false;
        $.each(this.tokens, function(index, value){
            if (value.type == 'logical') {
                stranded_logical = true;
            }
        });
        // return whether we have stranded logicals
        return stranded_logical;
    } // end of stranded parser

    // return whether we have stranded logicals
    return parser.stranded();
}



// hi mom
$(document).ready(function($) {

    // run on click
    $('#buildConditional').on('click', function(){
        run();
    });

    // clear our workspace
    $('#clearWorkspace').on('click', function(){
        $('#conditionalInput').val('');
        $('#resultsContainer').addClass('hidden');
    });

    // run on submit
    $('#conditionalForm').on('submit', function(e){
        e.preventDefault();
        run();
    });

    // insert reference buttons
    $('#customTags, #reference').on('click', '.btn-reference', function(){
        $('#conditionalInput').val($('#conditionalInput').val() + ' ' + $(this).data('insert'));
    });

    // insert examples
    $('.btn-example').on('click', function(){
        $('#conditionalInput').val($(this).data('example'));
        $('#buildConditional').click();
    });

    // run first expression as an example
    $('#buildConditional').click();

});