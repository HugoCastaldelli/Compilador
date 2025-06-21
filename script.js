const editor = document.getElementById("code_editor");
const line_numbers = document.getElementById("line_numbers");
const table_container = document.getElementById("table_container");
const file_chooser = document.getElementById("file_chooser"); 

const lexico_btn = document.getElementById("lexico_btn");
const token_btn = document.getElementById("token_btn");
const tabela_btn = document.getElementById("tabela_btn");
const erros_btn = document.getElementById("erros_btn");
const analisador_btn = document.getElementById("analisador_btn");

let Syntatic_table;
let html_content;

lexico_btn.addEventListener("click", function() {
    Compilar();
});

token_btn.addEventListener("click", function() {
    table_container.innerText = "";
    table_container.appendChild(create_table(Tokenss));
});

tabela_btn.addEventListener("click", function() {
    table_container.innerText = "";
    table_container.appendChild(create_table(TDV));
});

erros_btn.addEventListener("click", function() {
    table_container.innerText = "";
    table_container.appendChild(create_table(Erros));
});

analisador_btn.addEventListener("click", function() {
    table_container.innerText = "";
    table_container.appendChild(create_table(Analisador_preditivo));
});

document.getElementById("dowload_btn").addEventListener("click", function() {
    var conteudo = editor.innerText;
    
    var blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    link.download = "code.txt";
    
    link.click();
    
    URL.revokeObjectURL(link.href);
});

file_chooser.addEventListener("change", (event) => {
    const arquivo = event.target.files[0];
    if (arquivo) {
        const leitor = new FileReader();
        leitor.onload = function(e) {
          const conteudo = e.target.result;
          editor.textContent = conteudo;
        };
        leitor.readAsText(arquivo);
      }
      setTimeout(() => {
        update_line_numbers();
        update_colors();
    }, "100");
})

function replace_values(tabela,antigo_valor,novo_valor){
    let new_table = [...tabela];
    for (let i = 0; i < tabela.length; i++){
        for (let j = 0; j < tabela[i].length; j++){
            if (tabela[i][j] === antigo_valor){
                new_table[i][j] = novo_valor;
            }
        }
    }
    return new_table;
}

function update_line_numbers() {
    const lines = editor.innerText.split('\n').length;
    line_numbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("<br>");
}

function getCaretPosition(editableDiv) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editableDiv);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
}

function setCaretPosition(editableDiv, position) {
    const selection = window.getSelection();
    const range = document.createRange();
    let currentPos = 0;

    function traverseNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const nextPos = currentPos + node.textContent.length;
            if (nextPos >= position) {
                range.setStart(node, position - currentPos);
                range.collapse(true);
                return true;
            }
            currentPos = nextPos;
        } else {
            for (const child of node.childNodes) {
                if (traverseNodes(child)) return true;
            }
        }
        return false;
    }

    traverseNodes(editableDiv);
    selection.removeAllRanges();
    selection.addRange(range);
}

editor.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();

        // Cria uma nova linha corretamente
        const br = document.createElement("br");
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.insertNode(br); // Insere o <br> na posicao atual
        update_line_numbers(); 

        const caretPosition = getCaretPosition(editor);
        update_colors();
        setCaretPosition(editor, caretPosition+1);
    } 
    else if (event.key === "Backspace" || event.key === "Delete") {
        update_line_numbers(); 
    } 
    else if (event.key === " ") {
        const caretPosition = getCaretPosition(editor);
        update_colors();
        setCaretPosition(editor, caretPosition);
    }

    
});

function create_table(){
    var new_table = document.createElement("table");
    document.getElementById("table_container").appendChild(new_table);
}

function create_table(content) {
    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var tbody = document.createElement("tbody");
    var thd = function(i){return (i==0)?"th":"td";};
    for (var i=0;i<content.length;i++) {
      var tr = document.createElement("tr");
      for(var j=0;j<content[i].length;j++){
        var t = document.createElement(thd(i));
        var texto=document.createTextNode(content[i][j]);
        t.appendChild(texto);
        tr.appendChild(t);

        if(content[i][1] === "Error"){
            tr.setAttribute("class","error_line");
        }
      }
      (i==0)?thead.appendChild(tr):tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}


/*






    Logica do compilador







*/


const reservedWords = ["program", "procedure", "var", "int", "boolean", "read", "write", "true", "false", 
    "begin", "end", "if", "then", "else", "while", "do", "or", "and", "not"];

const reg_var = /^([a-zA-Z_][a-zA-Z0-9_]{0,24})$/;
const reg_int = /^(0|[1-9][0-9]{0,24})$/;
const operator = /^([+\-*/])$/;

let Erros,Analisador_preditivo, Tokenss;

function generateTokens(){
    const tokens = {};

    reservedWords.forEach(word => {
        tokens[word] = `reserved word ${word}`;
    });

    tokens[";"] = "end of line";
    tokens[","] = "comma";
    tokens["."] = "End of program";
    tokens["("] = "open parentheses";
    tokens[")"] = "close parentheses";
    tokens["="] = "equal to";
    tokens["<>"] = "not equal to";
    tokens[">"] = "greater than";
    tokens["<"] = "less than";
    tokens[">="] = "equal or greater than";
    tokens["<="] = "equal or less than";
    tokens[":="] = "assignment";
    tokens[":"] = "vartype";
    tokens["//"] = "comment line";

    return tokens;
}


function generateTableContent(code) {
    const table_content = [["Lexema", "Token", "Linha", "Coluna Inicio", "Coluna Fim"]];

    const tokens = generateTokens();

    const lines = code.split("\n");
    let code_html = "";
    let insideCommentBlock = false;

    lines.forEach((line, lineIndex) => {
        let colStart = 0;
        let formattedLine = "";
        const words = line.match(/>=|<=|<>|:=|\/\/.*|\d+\.\d+|\w+|\S/g) || [];

        let lastIndex = 0;
        words.forEach(word => {
            if (word.trim() !== "") {
                let tokenType = "";
                let spanClass = "";

                if (insideCommentBlock) {
                    tokenType = "comment";
                    spanClass = "comment";
                    if (word.includes("}")) { 
                        insideCommentBlock = false;
                    }
                } else if (tokens[word]) {
                    tokenType = tokens[word];
                    spanClass = "reserved_word";
                } else if (reg_int.test(word)) {
                    tokenType = "integer";
                    spanClass = "number";
                } else if (reg_var.test(word)) {
                    tokenType = "variable";
                    spanClass = "variable";
                } else if (operator.test(word)) {
                    tokenType = "operator";
                    spanClass = "operator";
                } else if (word.startsWith("//")) {
                    tokenType = "comment";
                    spanClass = "comment";
                } else if ( word.startsWith("{")) {
                    tokenType = "comment";
                    spanClass = "comment";
                    insideCommentBlock = true;
                } else {
                    tokenType = "Erro lexico";
                    spanClass = "error";
                }
                const wordIndex = line.indexOf(word, lastIndex);
                formattedLine += line.substring(lastIndex, wordIndex);
                formattedLine += `<span class="${spanClass}" spellcheck="false">${word}</span>`;
                lastIndex = wordIndex + word.length;
                
                const colEnd = colStart + word.length - 1;
                table_content.push([word, tokenType, lineIndex + 1, colStart + 1, colEnd + 1]);
            }
            colStart += word.length + 1;
        });
        
        formattedLine += line.substring(lastIndex); // Adiciona qualquer espaco em branco restante
        code_html += formattedLine + "\n"; // Mantém a quebra de linha original
    });
    code_html = code_html.slice(0, -1); // remove o \n extra que estava sobrando

    html_content = code_html; //para as cores

    return table_content;
}

function remove_comments(code){
    let j = 0;
    while(j <= code.length){
        if (code[j] === "}"){
            j++;
        }
        while (j <= code.length && code[j] != "{"){
            j++;
        };
        let commentStart_index = j;
        while (j <= code.length && code[j] != "}"){
            j++;
        }
        let commentEnd_index = j;

        if (j > code.length){
            code = code.slice(0,commentStart_index)
            break;
        }
        code = code.slice(0,commentStart_index) + code.slice(commentEnd_index+1,code.length);
        j = j - (commentEnd_index - commentStart_index);
    } 
    let i = 0;
    while(i <= code.length){
        while (i <= code.length && !(code[i] === "/" && code[i+1] === "/")){
            i++;
        };
        let comment_start_index = i;
        while (i <= code.length && code[i] != "\n"){
            i++;
        }
        let comment_end_index = i;
        code = code.slice(0,comment_start_index) + code.slice(comment_end_index+1,code.length);
        i = i - (comment_end_index - comment_start_index);
    }
    return code;
}

function analizador_lexico(){
    let code = editor.innerText;

    no_comments_code = remove_comments(code);
    
    const table_content = generateTableContent(no_comments_code);
    //  TOKEN
    Tokenss = table_content;
}

function update_colors(){
    let code = editor.innerText;
    generateTableContent(code);
    editor.innerHTML = html_content;
}

function transposeMatrix(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

function filtrarErrosETriangular(tabela) {
    if (!Array.isArray(tabela) || tabela.length <= 1) return tabela;

    const cabecalho = tabela[0];
    
    // Filtra apenas as linhas que têm "Erro" no início da segunda coluna
    const erros = tabela.slice(1).filter(linha => 
        typeof linha[1] === 'string' && linha[1].startsWith("Erro")
    );

    // Ordena por Linha (índice 2) e Coluna Inicio (índice 3)
    erros.sort((a, b) => {
        const linhaA = parseInt(a[2], 10);
        const linhaB = parseInt(b[2], 10);
        if (linhaA !== linhaB) return linhaA - linhaB;
        return parseInt(a[3], 10) - parseInt(b[3], 10);
    });

    return [cabecalho, ...erros];
}

const TDV = [         
    [''       ,'program'                ,'int'              , 'boolean'        , '.'            , ';'            , 'procedure'                  , 'begin'           , 'ident'            ,'write'        ,'read'         ,'true'      , 'false'     , ':'             , ','            , '('              , ')'            , 'var'                , 'end'           , 'else'          , 'if'                      , 'while'                , ':='     , '+'           , '-'            , 'number'    , 'not'        , '='           , '<>'           , '<'            , '<='           , '=>'           , '>'          , 'then'          , 'do'           , ']'             , 'or'            , '*'            , 'div'           , 'and'           , '['            , '$'],
    ['P'      ,'program ident ; B .'    ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ERROR'        , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'TOKEN_SYNC'],
    ['B'      ,'ERROR'                  ,'PDV PDS CC'       , 'PDV PDS CC'     , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'PDV PDS CC'                 , 'PDV PDS CC'      , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['PDV'    ,'ERROR'                  ,'DV ; DV*'         , 'DV ; DV*'       , 'ERROR'        , 'ERROR'        , 'ε'                          , 'ε'               , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['DV'     ,'ERROR'                  ,'TIPO LI'          , 'TIPO LI'        , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['DV*'    ,'ERROR'                  ,'DV ; DV*'         , 'DV ; DV*'       , 'ERROR'        , 'ERROR'        , 'ε'                          , 'ε'               , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['TIPO'   ,'ERROR'                  ,'int'              , 'boolean'        , 'ERROR'        , 'ERROR'        , 'ERROR'                      , 'ERROR'           , 'TOKEN_SYNC'       ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['LI'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'ERROR'           , 'ident LI*'        ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'TOKEN_SYNC'    , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['LI*'    ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ε'            , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ε'             , '\, ident LI*' , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['PDS'    ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ERROR'        , 'DP ; DP*'                   , 'ε'               , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['DP*'    ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ERROR'        , 'DP ; DP*'                   , 'ε'               , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['DP'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'procedure ident PF ; B'     , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['PF'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ε'            , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , '( SPF SPF* )'   , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['SPF'    ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'ERROR'           , 'ident LI* : TIPO' ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'TOKEN_SYNC'   , 'var LI : TIPO'      , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['SPF*'   ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , '; SPF SPF*'   , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ε'            , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['CC'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'ERROR'                      , 'begin C CC* end' , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ε'            , 'ERROR'              , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['CC*'    ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , '; C CC*'      , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ε'             , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['C'      ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'CC'              , 'ident C*'         ,'write ( LE )' ,'read ( LE )'  ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'COND'                    , 'CR'                   , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['C*'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ε'            , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'CP'             , 'ERROR'        , 'ERROR'              , 'ε'             , 'ε'             , 'ERROR'                   , 'ERROR'                , ':= E'   , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , '[ E ] := E'   , 'ERROR'],
    ['CP'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ε'            , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , '( LE )'         , 'ERROR'        , 'ERROR'              , 'ε'             , 'ε'             , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['COND'   ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'if E then C COND*'       , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['COND*'  ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ε'            , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'ε'             , 'else C'        , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['CR'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'ERROR'          , 'ERROR'        , 'ERROR'              , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'ERROR'                   , 'while E do C'         , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['LE'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ERROR'        , 'ERROR'                      , 'ERROR'           , 'E E*'             ,'ERROR'        ,'ERROR'        ,'E E*'      , 'E E*'      , 'ERROR'         , 'ERROR'        , 'E E*'           , 'TOKEN_SYNC'   , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'E E*'        , 'E E*'         , 'E E*'      , 'E E*'       , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['E*'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ERROR'        , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , '\, E E*'      , 'ERROR'          , 'ε'            , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['E'      ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'ERROR'           , 'ES E**'           ,'ERROR'        ,'ERROR'        ,'ES E**'    , 'ES E**'    , 'ERROR'         , 'TOKEN_SYNC'   , 'ES E**'         , 'TOKEN_SYNC'   , 'ERROR'              , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'ERROR'                   , 'ERROR'                , 'ERROR'  ,'ES E**'       , 'ES E**'       , 'ES E**'    , 'ES E**'     , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'TOKEN_SYNC'    , 'TOKEN_SYNC'   , 'TOKEN_SYNC'    , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['ES'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'ERROR'           , 'OP T ES*'         ,'ERROR'        ,'ERROR'        ,'OP T ES*'  , 'OP T ES*'  , 'ERROR'         , 'TOKEN_SYNC'   , 'OP T ES*'       , 'TOKEN_SYNC'   , 'ERROR'              , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'OP T ES*'    , 'OP T ES*'     , 'OP T ES*'  , 'OP T ES*'   , 'TOKEN_SYNC'  , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC' , 'TOKEN_SYNC'    , 'TOKEN_SYNC'   , 'TOKEN_SYNC'    , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['OP'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ERROR'        , 'ERROR'                      , 'ERROR'           , 'ε'                ,'ERROR'        ,'ERROR'        ,'ε'         , 'ε'         , 'ERROR'         , 'ERROR'        , 'ε'              , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , '+'           , '-'            , 'ε'         , 'ε'          , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],     
    ['OP2'    ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ERROR'        , 'ERROR'                      , 'ERROR'           , 'TOKEN_SYNC'       ,'ERROR'        ,'ERROR'        ,'TOKEN_SYNC', 'TOKEN_SYNC', 'ERROR'         , 'ERROR'        , 'TOKEN_SYNC'     , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , '+'           , '-'            , 'TOKEN_SYNC', 'TOKEN_SYNC' , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'or'            , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['OP3'    ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ERROR'        , 'ERROR'                      , 'ERROR'           , 'TOKEN_SYNC'       ,'ERROR'        ,'ERROR'        ,'TOKEN_SYNC', 'TOKEN_SYNC', 'ERROR'         , 'ERROR'        , 'TOKEN_SYNC'     , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        ,'TOKEN_SYNC' , 'TOKEN_SYNC' , 'ERROR'       , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'        , 'ERROR'      , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , '*'            , 'div'           , 'and'           , 'ERROR'        , 'ERROR'],
    ['R'      ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ERROR'        , 'ERROR'                      , 'ERROR'           , 'TOKEN_SYNC'       ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ERROR'        , 'TOKEN_SYNC'     , 'ERROR'        , 'ERROR'              , 'ERROR'         , 'ERROR'         , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'TOKEN_SYNC'  , 'TOKEN_SYNC'   , 'TOKEN_SYNC', 'TOKEN_SYNC' , '='           , '<>'           , '<'            , '<='           , '=>'           , '>'          , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['T'      ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'ERROR'           , 'F T*'             ,'ERROR'        ,'ERROR'        ,'F T*'      , 'F T*'      , 'ERROR'         , 'TOKEN_SYNC'   , 'F T*'           , 'TOKEN_SYNC'   , 'ERROR'              ,  'TOKEN_SYNC'   , 'TOKEN_SYNC'    , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'TOKEN_SYNC'  , 'TOKEN_SYNC'   , 'F T*'      , 'F T*'       , 'TOKEN_SYNC'  , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC' , 'TOKEN_SYNC'    , 'TOKEN_SYNC'   , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['F'      ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'ERROR'           , 'V'                ,'ERROR'        ,'ERROR'        ,'true'      , 'false'     , 'ERROR'         , 'TOKEN_SYNC'   , '( E )'          , 'TOKEN_SYNC'   , 'ERROR'              ,  'TOKEN_SYNC'   , 'TOKEN_SYNC'    , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'TOKEN_SYNC'  , 'TOKEN_SYNC'   , 'number'    , 'not F'      , 'TOKEN_SYNC'  , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC' , 'TOKEN_SYNC'    , 'TOKEN_SYNC'   , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'TOKEN_SYNC'   , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'ERROR'        , 'ERROR'],
    ['ES*'    ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ε'            , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ε'            , 'ERROR'          , 'ε'            , 'ERROR'              ,  'ε'            , 'ε'             , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'OP2 T ES*'   , 'OP2 T ES*'    , 'ERROR'     , 'ERROR'      , 'ε'           , 'ε'            , 'ε'            , 'ε'            , 'ε'            , 'ε'          , 'ε'             , 'ε'            , 'ε'             , 'OP2 T ES*'     , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['E**'    ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ε'            , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ε'            , 'ERROR'          , 'ε'            , 'ERROR'              , 'ε'             , 'ε'             , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      ,'R ES'         , 'R ES'         ,'R ES'          , 'R ES'         , 'R ES'         , 'R ES'       , 'ε'             , 'ε'            , 'ε'             , 'ERROR'         , 'ERROR'        , 'ERROR'         , 'ERROR'         , 'ERROR'        , 'ERROR'],
    ['T*'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ε'            , 'ERROR'                      , 'ERROR'           , 'ERROR'            ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'ε'            , 'ERROR'          , 'ε'            , 'ERROR'              ,  'ε'            , 'ε'             , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ε'           , 'ε'            , 'ERROR'     , 'ERROR'      , 'ε'           , 'ε'            , 'ε'            , 'ε'            , 'ε'            , 'ε'          , 'ε'             , 'ε'            , 'ε'             , 'ε'             , 'OP3 F T*'     , 'OP3 F T*'      , 'OP3 F T*'      , 'ERROR'        , 'ERROR'],
    ['V'      ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'TOKEN_SYNC'   , 'ERROR'                      , 'TOKEN_SYNC'      , 'ident V*'         ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'         , 'TOKEN_SYNC'   , 'ERROR'          , 'ERROR'        , 'ERROR'              ,  'TOKEN_SYNC'   , 'TOKEN_SYNC'    , 'ERROR'                   , 'ERROR'                , 'ERROR'  , 'ERROR'       , 'ERROR'        , 'ERROR'     , 'ERROR'      , 'TOKEN_SYNC'  , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC'   , 'TOKEN_SYNC' , 'TOKEN_SYNC'    , 'TOKEN_SYNC'   , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'TOKEN_SYNC'   , 'TOKEN_SYNC'    , 'TOKEN_SYNC'    , 'ERROR'        , 'ERROR'],
    ['V*'     ,'ERROR'                  ,'ERROR'            , 'ERROR'          , 'ERROR'        , 'ε'            , 'ERROR'                      , 'ε'               , 'ε'                ,'ERROR'        ,'ERROR'        ,'ERROR'     , 'ERROR'     , 'ERROR'          , 'ε'            , 'ERROR'          , 'ε'            , 'ERROR'              ,  'ε'            , 'ε'             , 'ERROR'                   , 'ERROR'                , 'ε'      , 'ε'           , 'ε'            , 'ERROR'     , 'ERROR'      , 'ε'           , 'ε'            , 'ε'            , 'ε'            , 'ε'            , 'ε'          , 'ε'             , 'ε'            , 'ε'             , 'ε'             , 'ERROR'        , 'ε'             , 'ERROR'         , '[ E ]'       , 'ERROR'],
    
  ];

function analizador_sintatico() {
    // debugger;
    errors_list = [];
    Erros = [];

    let matriz_transposta = transposeMatrix(TDV);
    let pilha = ['$'];
    pilha.push(TDV[1][0]);

    let code = editor.innerText;
    let no_comments_code = remove_comments(code);
    const table_content = generateTableContent(no_comments_code);

    let entrada = table_content.map(item => item[0]);
    entrada.shift();
    entrada.push('$');

    let tabela_sintatica = [["Pilha", "Entrada", "Regra"]];
    let regra_aplicada = "";
    let a = 1;
    while (pilha[pilha.length - 1] !== '$' && entrada.length > 0) {
        let token = entrada[0];
        let token_original = token;
        
        // Adiciona a linha atual com a regra da iteração anterior
        tabela_sintatica.push([pilha.slice().reverse().join(' '), entrada.join(' ')]);
        regra_aplicada = "";

        if (!TDV[0].includes(token) && !reservedWords.includes(token)) {
            if (reg_var.test(token)){
                token = "ident";
            }
            if (reg_int.test(token)){
                token = "number"
            }
        }

        if (pilha[pilha.length - 1] === token) {
            pilha.pop();
            entrada.shift();
            regra_aplicada = "Casa " + token;
        } else if (TDV[0].includes(token) && matriz_transposta[0].includes(pilha[pilha.length - 1])) {
            let index = matriz_transposta[0].indexOf(pilha[pilha.length - 1]);
            let topo_pilha = pilha[pilha.length - 1];
            let producao = TDV[index][TDV[0].indexOf(token)];
            
            if (producao !== 'ERROR' && producao !== 'ε' && producao !== 'TOKEN_SYNC') {
                regra_aplicada = topo_pilha + " -> " + producao;
                pilha.pop();
                pilha.push(...producao.split(' ').reverse());
            } else if (producao === 'ε') {
                pilha.pop();
                regra_aplicada = topo_pilha + " -> ε";
                tabela_sintatica[a].push(regra_aplicada);
                a++;
                continue;
            } else if(producao === 'TOKEN_SYNC'){
                regra_aplicada = `Erro SINC: remove ${topo_pilha}`;
                Tratamento_Erro(errors_list,pilha,entrada,"SINC");
                pilha.pop();
            }else{
                regra_aplicada = `Erro: \"${token_original}\" pula`;
                Tratamento_Erro(errors_list,pilha,entrada,"ER");
                entrada.shift();
            }
        }else{
            regra_aplicada = `Erro: \"${pilha[pilha.length - 1]}\" pula (${token_original}) esperado`;
            Tratamento_Erro(errors_list,pilha,entrada,"TOKEN");
            pilha.pop();
        }
        tabela_sintatica[a].push(regra_aplicada);
        a++;
    }

    // Adiciona a última linha com a regra final
    tabela_sintatica.push([pilha.slice().reverse().join(' '), entrada.join(' ')]);

    if (errors_list.length === 0) {
        console.log("Código Válido");
        tabela_sintatica[a].push("certo");
        table_container.innerText = "";
    } else {

        let error_table = table_content;
        errors_list.forEach(erro => {
            let dados_originais = table_content.find(row => row[0] === erro[0]);

            if (dados_originais) {
                error_table.push([erro[0],erro[1], ...dados_originais.slice(2)]);
            } else {
                error_table.push([erro[0], erro[1]]);
            }
        });
        const tabela_filtrada = filtrarErrosETriangular(error_table);
        Erros = tabela_filtrada;
    }

    Analisador_preditivo = tabela_sintatica;
}

function Tratamento_Erro(errors_list,pilha, token, tipo){
    var teste = errors_list.filter(
    e => (e[0] === "Erro" && e[1] === "Erro sintático"));

    if (tipo === "SINC"){
         if(pilha[pilha.length - 1] === "ES" && token[0] === ")"){
            errors_list.push([token[0],"Erro na expressão"]);
         }else if(pilha[pilha.length - 1] === "F" && token[0] === ";"){
            errors_list.push(["*","Erro na expressão"]);
         }else{
            if (teste.length === 0){
                errors_list.push(["Erro","Erro sintático"]);
            }
         }
    }else if(tipo === "ER"){
        if(pilha[pilha.length - 1] === "COND*" && token[0] === "."){
            errors_list.push(["end","Erro: Comando não terminado"]);
        }else if(pilha[pilha.length - 1] === "T*" && !reservedWords.includes(token[0]) && token[1] === ":=" && !reg_int.test(token[2])){
            errors_list.push([token[0], "Erro: falta \" ; \""]);
        }else if(pilha[pilha.length - 1] === "LI*" && token[0] === "int" && pilha[pilha.length - 3] === "TIPO"){
            errors_list.push([token[0], "Erro: falta \" : \""]);
        }else if(pilha[pilha.length - 1] === "SPF" && token[0] === "int"){
            errors_list.push([token[0], "Erro: falta \")\""]);
        }else if((pilha[pilha.length - 1] === "LI*" && token[0] === "boolean") || (pilha[pilha.length - 1] === "LI*" && token[0] === "int")){
             errors_list.push([token[0], "Erro: erro na atribução, falta \" ; \""]);
        }else if (pilha[pilha.length - 1] === "LI*" && !reservedWords.includes(token[0]) && token[1] === ";" && pilha[pilha.length - 1] === "LI*" && pilha[pilha.length - 2] === ";" && pilha[pilha.length - 3] === "DV*"&& pilha[pilha.length - 4] === "PDS" && pilha[pilha.length - 5] === "CC" && pilha[pilha.length - 6] === "." && pilha[pilha.length - 7]){
            errors_list.push([token[0], "Erro: erro na atribução, falta \" , \""]);
        }else if (pilha[pilha.length - 1] === "DV*" && token[0] !== "procedure" && !reservedWords.includes(token[1]) && token[2] === "("){
            errors_list.push([token[0],`Erro de palavra reservada ${token[0]}`]);
        } else if(pilha[pilha.length - 1] === "C*" && token[0] === "="){
            errors_list.push(["=", "Erro: Atribuicao com operador errado"]);
        } else if(pilha[pilha.length - 1] === "T*" && token[0] === "begin"){
            errors_list.push([token[0], "Erro: falta \'do\'"]);
        } else{
            if (teste.length === 0){
                errors_list.push(["Erro","Erro sintático"]);
            }
        }
    }else{
        if (pilha[pilha.length - 1] === ")" && token[0] === "do"){
            errors_list.push(["while", "Erro: falta )"]);
        }else if(pilha[pilha.length - 1] === "then" && token[0] === ")"){
            errors_list.push(["if", "Erro: falta ("]);
        }else if(pilha[pilha.length - 1] === ")" && token[0] === "then"){
            errors_list.push(["if", "Erro: falta )"]);
        }else if(pilha[pilha.length - 1] === "do" && token[0] === ")" && token[1] === "do"){
            errors_list.push(["while", "Erro: falta ("]);
        }else if(pilha[pilha.length - 1] === "." && token[0] === "$"){
            errors_list.push(["end","Erro: falta \" . \""]);
        }else if ((pilha[pilha.length - 1] === ";" && token[0] === "int") || (pilha[pilha.length - 1] === ";" && token[0] === "boolean")){
            errors_list.push(["correto","Erro: falta \" ; \""]);
        } else if(pilha[pilha.length - 1] === ")" && token[0] === ";"){
            errors_list.push([pilha[pilha.length - 1], "Erro na expressão"]);
        } else if(pilha[pilha.length - 1] === "then" && token[0] === "end"){
            errors_list.push([token[0], "Erro: falta \'then\'"]);
        }else{
            if (teste.length === 0){
                errors_list.push(["Erro","Erro sintático"]);
            }
        }
    }
}

/*






    Logica da análise Semântica







*/

function analise_semantica(){
    let code = editor.innerText;
    let no_comments_code = remove_comments(code);
    let table_content = generateTableContent(no_comments_code);
    table_content[0].push(...["Tipo","Valor","Categoria","Escopo","Utilizada"]);

    let variaveis = [];
    let erros_list = [];
    let tipoAtual = "";
    
    let escopoAtual = "global";
    let escopos = [escopoAtual]

    for (let i = 1; i < table_content.length; i++) { 
    let [lexema, token, linha, colIni, colFim] = table_content[i];
    let proximo = table_content[i+1];
    let depoisProximo = table_content[i+2];
    let depoisdepoisProximo = table_content[i+3];
    let anterior = table_content[i-1];

    if (token === "variable") {

        //  Caso: Declaração de parâmetro de procedimento (exemplo: x: int)
        if (proximo && proximo[0] === ":" && depoisProximo && (depoisProximo[0] === "int" || depoisProximo[0] === "boolean")) {
            table_content[i].push(...[depoisProximo[0], "-", "par", escopoAtual, "não"]);
            variaveis.push(lexema);

        //  Caso: Nome do programa (exemplo: program exemplo)
        } else if (anterior && anterior[0] === "program") {
            table_content[i].push(...["-", "-", table_content[i][0], escopoAtual, "-"]);

        //  Caso: Declaração de variável (exemplo: int x, y, z;)
        } else if((anterior && (anterior[0] === "boolean" || anterior[0] === "int")) || (proximo && proximo[0] === "," || anterior[0] === ",")) {

            if (!variaveis.includes(lexema)){
                table_content[i].push(...[tipoAtual, "-", "var", escopoAtual, "não"]);
                variaveis.push(lexema);
            } else {
                table_content.push([lexema, "Erro de declaração: Variável já declarada"]);
            }

        //  Caso: Atribuição de valor (exemplo: x := 5;)
        } else if (proximo && proximo[0] === ":=" && depoisProximo) {
            let error = true;
                // Procura a variável na tabela para atualizar valor e marcar como utilizada
                for (let j = 1; j < table_content.length; j++) {
                    if (table_content[j][0] === lexema && table_content[j][6] === "-" && table_content[j][9] === "não") {
                        if (table_content[j][5] === "boolean" && (depoisProximo[0] === "true" || depoisProximo[0] === "false")) {
                            table_content[j][6] = depoisProximo[0];
                            table_content[j][9] = "sim";
                            error = false;
                            break;
                        } else if (table_content[j][5] === "int" && reg_int.test(depoisProximo[0])) {
                            table_content[j][6] = depoisProximo[0];
                            table_content[j][9] = "sim";
                            error = false;
                            break;
                        } else if (table_content[j][5] === "int" && depoisProximo[0] === "-") {
                            table_content[j][6] = String(depoisProximo[0]) + String(depoisdepoisProximo[0]);
                            table_content[j][9] = "sim";
                            error = false;
                            break;
                        }
                    }
                }
                if (error) {
                    table_content.push([lexema, "Erro de atribuição: Tipo incompatível"]);
                }
        //  Caso: Outras ocorrências de variável (não identificadas nas condições acima)
        } else {
            table_content[i].push("-", "-", "-", "-", "-");
        }

        //  Caso: Início de um procedimento (exemplo: procedure soma)
        } else if (lexema === "procedure") {
            escopoAtual = proximo[0]; // Nome do procedimento vira o novo escopo
            escopos.push(escopoAtual);
            table_content[i].push("-", "-", "-", "-", "-");

        //  Caso: Fim de um escopo (end de um procedimento ou bloco)
        } else if (lexema === "end" && (proximo && proximo[0] !== "else")) {
            escopos.pop();
            escopoAtual = escopos[escopos.length - 1];
            table_content[i].push("-", "-", "-", "-", "-");

        //  Caso: Novo escopo interno de bloco (exemplo: begin dentro de um if ou while)
        } else if (lexema === "begin" && anterior && (anterior[0] === "do" || anterior[0] === "then")) {
            escopoAtual = anterior[0] + "_" + linha;  // Nomeia o escopo com base no comando (do/then) e na linha
            escopos.push(escopoAtual);
            table_content[i].push("-", "-", "-", "-", "-"); 

        //  Caso: Mudança do tipo atual para declaração de variáveis (exemplo: int ou boolean)
        } else if((lexema === "int" || lexema === "boolean") && (anterior && anterior[0] !== ":" )){
            tipoAtual = lexema;
            table_content[i].push("-", "-", "-", "-", "-"); 

        //  Caso geral (tokens que não alteram tipo, escopo ou variáveis)
        } else {
            table_content[i].push("-", "-", "-", "-", "-");   
        }
    }

    
    Tokenss = table_content;
}       

function Compilar(){
    table_container.innerText = "";
    analizador_lexico();
    analizador_sintatico();
    analise_semantica();

    if(errors_list == ""){
        alert("Compilado sem erros");
    }else{
        alert("Error");
    }
}
