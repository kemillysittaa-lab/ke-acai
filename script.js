// ======================================
// KE AÇAÍ - DELIVERY
// ======================================

const SUPABASE_URL =
    "https://ncukfroazgjnwvrmzxyu.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_T9oyWTb31mxJybxM09Z81A_AoXqfdig";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

const whatsapp = "5516996211605";

let carrinho = [];
let adicionais = [];
let adicionaisDisponiveis = [];

let cupomAplicado = null;
let valorDesconto = 0;


// ======================================
// FORMATA VALORES
// ======================================

function dinheiro(valor) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}


// ======================================
// PROTEÇÃO DE TEXTO
// ======================================

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto == null ? "" : String(texto);

    return div.innerHTML;
}


// ======================================
// CARREGAR CARDÁPIO
// ======================================

async function carregarCardapio() {

    try {

        const [
            respostaProdutos,
            respostaTamanhos,
            respostaAdicionais
        ] = await Promise.all([

            supabaseClient
                .from("Produtos")
                .select("*")
                .eq("ativo", true)
                .order(
                    "ordem",
                    { ascending: true }
                ),

            supabaseClient
                .from("Tamanhos")
                .select("*")
                .eq("ativo", true)
                .order(
                    "ordem",
                    { ascending: true }
                ),

            supabaseClient
                .from("Adicionais")
                .select("*")
                .eq("ativo", true)
                .order(
                    "ordem",
                    { ascending: true }
                )

        ]);

        if (respostaProdutos.error) {
            throw respostaProdutos.error;
        }

        if (respostaTamanhos.error) {
            throw respostaTamanhos.error;
        }

        if (respostaAdicionais.error) {
            throw respostaAdicionais.error;
        }

        const produtos =
            respostaProdutos.data || [];

        const tamanhos =
            respostaTamanhos.data || [];

        adicionaisDisponiveis =
            respostaAdicionais.data || [];

        montarProdutos(
            produtos,
            tamanhos,
            adicionaisDisponiveis
        );

        montarAdicionais(
            adicionaisDisponiveis
        );

        montarTamanhosMonte(
            produtos,
            tamanhos
        );

        calcularMontagem();

    } catch (erro) {

        console.error(
            "Erro ao carregar cardápio:",
            erro
        );
    }
}


// ======================================
// PRODUTOS DO CARDÁPIO
// ======================================

function montarProdutos(
    produtos,
    tamanhos,
    adicionaisBanco
) {

    const areaProdutos =
        document.querySelector(
            ".produtos"
        );

    if (!areaProdutos) {
        return;
    }

    areaProdutos.innerHTML = "";

    produtos.forEach(
        function(produto) {

            /*
             * Se o produto tiver "Monte" no nome,
             * ele NÃO aparece nos cards.
             *
             * Mas continua no banco para fornecer
             * os tamanhos/preços ao Monte seu Ke.
             */
            const nomeProduto =
                String(
                    produto.nome || ""
                ).toLowerCase();

            if (
                nomeProduto.includes("monte")
            ) {
                return;
            }

            const tamanhosProduto =
                tamanhos.filter(
                    function(tamanho) {

                        return (
                            Number(
                                tamanho.produto_id
                            ) ===
                            Number(
                                produto.id
                            )
                        );
                    }
                );

            if (
                tamanhosProduto.length === 0
            ) {
                return;
            }

            const artigo =
                document.createElement(
                    "article"
                );

            artigo.className =
                "produto";

            artigo.dataset.produtoId =
                produto.id;

            const opcoes =
                tamanhosProduto
                    .map(
                        function(tamanho) {

                            return `
                                <option
                                    value="${Number(tamanho.preco)}"
                                    data-tamanho="${escaparHTML(tamanho.tamanho)}"
                                >
                                    ${escaparHTML(tamanho.tamanho)}
                                    —
                                    ${dinheiro(tamanho.preco)}
                                </option>
                            `;
                        }
                    )
                    .join("");

            const opcoesAdicionais =
                adicionaisBanco
                    .map(
                        function(adicional) {

                            return `
                                <label class="adicional adicional-produto">

                                    <span>

                                        <input
                                            type="checkbox"
                                            class="checkbox-adicional-produto"
                                            data-nome="${escaparHTML(adicional.nome)}"
                                            value="${Number(adicional.preco)}"
                                        >

                                        ${escaparHTML(adicional.nome)}

                                    </span>

                                    <strong>
                                        + ${dinheiro(adicional.preco)}
                                    </strong>

                                </label>
                            `;
                        }
                    )
                    .join("");

            let fotoProduto = "";

            if (
                produto.imagem &&
                String(produto.imagem).trim() !== ""
            ) {

                fotoProduto = `

                    <div class="foto-produto-container">

                        <img
                            src="${escaparHTML(produto.imagem)}"
                            alt="${escaparHTML(produto.nome)}"
                            class="foto-produto"
                            loading="lazy"
                        >

                    </div>

                `;

            } else {

                fotoProduto = `

                    <div class="icone-produto">
                        💜
                    </div>

                `;
            }

            artigo.innerHTML = `

                ${fotoProduto}

                <div class="conteudo-produto">

                    <h3>
                        ${escaparHTML(produto.nome)}
                    </h3>

                    <p>
                        ${escaparHTML(produto.descricao || "")}
                    </p>

                    <select class="tamanho-produto">
                        ${opcoes}
                    </select>

                    <div class="adicionais-produto-container">

                        <button
                            type="button"
                            class="abrir-adicionais-produto"
                        >
                            + Escolher adicionais
                        </button>

                        <div
                            class="lista-adicionais-produto"
                            style="display:none;"
                        >

                            ${opcoesAdicionais}

                        </div>

                    </div>

                    <div class="total-produto">

                        <span>
                            Total
                        </span>

                        <strong class="valor-produto">
                            ${dinheiro(tamanhosProduto[0].preco)}
                        </strong>

                    </div>

                    <button
                        class="adicionar-produto"
                    >
                        Adicionar ao carrinho 🛒
                    </button>

                </div>

            `;

            areaProdutos.appendChild(
                artigo
            );
        }
    );

    ativarProdutos();
}


// ======================================
// ATIVAR PRODUTOS
// ======================================

function ativarProdutos() {

    document
        .querySelectorAll(".produto")
        .forEach(
            function(produto) {

                const select =
                    produto.querySelector(
                        ".tamanho-produto"
                    );

                const botaoAdicionais =
                    produto.querySelector(
                        ".abrir-adicionais-produto"
                    );

                const lista =
                    produto.querySelector(
                        ".lista-adicionais-produto"
                    );

                const checkboxes =
                    produto.querySelectorAll(
                        ".checkbox-adicional-produto"
                    );

                const botaoAdicionar =
                    produto.querySelector(
                        ".adicionar-produto"
                    );

                if (select) {

                    select.addEventListener(
                        "change",
                        function() {

                            calcularTotalProduto(
                                produto
                            );
                        }
                    );
                }

                if (
                    botaoAdicionais &&
                    lista
                ) {

                    botaoAdicionais.addEventListener(
                        "click",
                        function() {

                            const aberto =
                                lista.style.display !==
                                "none";

                            lista.style.display =
                                aberto
                                    ? "none"
                                    : "grid";

                            botaoAdicionais.textContent =
                                aberto
                                    ? "+ Escolher adicionais"
                                    : "− Fechar adicionais";
                        }
                    );
                }

                checkboxes.forEach(
                    function(checkbox) {

                        checkbox.addEventListener(
                            "change",
                            function() {

                                calcularTotalProduto(
                                    produto
                                );
                            }
                        );
                    }
                );

                if (botaoAdicionar) {

                    botaoAdicionar.addEventListener(
                        "click",
                        function() {

                            adicionarProdutoAoCarrinho(
                                produto
                            );
                        }
                    );
                }

                calcularTotalProduto(
                    produto
                );
            }
        );
}


// ======================================
// CALCULAR TOTAL DO PRODUTO
// ======================================

function calcularTotalProduto(produto) {

    const select =
        produto.querySelector(
            ".tamanho-produto"
        );

    const valorElemento =
        produto.querySelector(
            ".valor-produto"
        );

    if (
        !select ||
        select.options.length === 0
    ) {
        return 0;
    }

    let total =
        Number(
            select.value
        ) || 0;

    const marcados =
        produto.querySelectorAll(
            ".checkbox-adicional-produto:checked"
        );

    marcados.forEach(
        function(adicional) {

            total +=
                Number(
                    adicional.value
                ) || 0;
        }
    );

    if (valorElemento) {

        valorElemento.textContent =
            dinheiro(total);
    }

    return total;
}


// ======================================
// ADICIONAR PRODUTO AO CARRINHO
// ======================================

function adicionarProdutoAoCarrinho(
    produto
) {

    const titulo =
        produto.querySelector(
            "h3"
        );

    const select =
        produto.querySelector(
            ".tamanho-produto"
        );

    if (
        !titulo ||
        !select ||
        select.options.length === 0
    ) {
        return;
    }

    const opcao =
        select.options[
            select.selectedIndex
        ];

    const nome =
        titulo.innerText.trim();

    const tamanho =
        opcao.dataset.tamanho;

    const listaAdicionais = [];

    produto
        .querySelectorAll(
            ".checkbox-adicional-produto:checked"
        )
        .forEach(
            function(adicional) {

                listaAdicionais.push({

                    nome:
                        adicional.dataset.nome,

                    preco:
                        Number(
                            adicional.value
                        ) || 0
                });
            }
        );

    const preco =
        calcularTotalProduto(
            produto
        );

    carrinho.push({

        nome:
            nome,

        tamanho:
            tamanho,

        adicionais:
            listaAdicionais,

        preco:
            preco
    });

    recalcularCupom();

    atualizarCarrinho();

    alert(
        nome +
        " adicionado ao carrinho! 💜"
    );

    produto
        .querySelectorAll(
            ".checkbox-adicional-produto"
        )
        .forEach(
            function(adicional) {

                adicional.checked =
                    false;
            }
        );

    calcularTotalProduto(
        produto
    );
}


// ======================================
// ADICIONAIS DO MONTE SEU KE
// ======================================

function montarAdicionais(
    adicionaisBanco
) {

    const area =
        document.querySelector(
            ".lista-adicionais"
        );

    if (!area) {
        return;
    }

    area.innerHTML = "";

    adicionaisBanco.forEach(
        function(adicional) {

            const label =
                document.createElement(
                    "label"
                );

            label.className =
                "adicional";

            label.innerHTML = `

                <span>

                    <input
                        type="checkbox"
                        class="checkbox-adicional"
                        data-nome="${escaparHTML(adicional.nome)}"
                        value="${Number(adicional.preco)}"
                    >

                    ${escaparHTML(adicional.nome)}

                </span>

                <strong>
                    + ${dinheiro(adicional.preco)}
                </strong>

            `;

            area.appendChild(
                label
            );
        }
    );

    adicionais =
        Array.from(
            document.querySelectorAll(
                ".checkbox-adicional"
            )
        );

    adicionais.forEach(
        function(adicional) {

            adicional.addEventListener(
                "change",
                calcularMontagem
            );
        }
    );
}


// ======================================
// TAMANHOS DO MONTE SEU KE
// ======================================

function montarTamanhosMonte(
    produtos,
    tamanhos
) {

    const tamanhoMonte =
        document.getElementById(
            "tamanho-monte"
        );

    if (!tamanhoMonte) {
        return;
    }

    const produtoMonte =
        produtos.find(
            function(produto) {

                const nome =
                    String(
                        produto.nome || ""
                    )
                    .toLowerCase();

                return (
                    nome.includes("monte")
                );
            }
        );

    let tamanhosMonte = [];

    if (produtoMonte) {

        tamanhosMonte =
            tamanhos.filter(
                function(tamanho) {

                    return (
                        Number(
                            tamanho.produto_id
                        ) ===
                        Number(
                            produtoMonte.id
                        )
                    );
                }
            );
    }

    if (
        tamanhosMonte.length === 0
    ) {

        const mapa =
            new Map();

        tamanhos.forEach(
            function(tamanho) {

                const chave =
                    String(
                        tamanho.tamanho
                    );

                if (
                    !mapa.has(chave)
                ) {

                    mapa.set(
                        chave,
                        tamanho
                    );
                }
            }
        );

        tamanhosMonte =
            Array.from(
                mapa.values()
            );
    }

    tamanhoMonte.innerHTML = "";

    tamanhosMonte.forEach(
        function(tamanho) {

            const opcao =
                document.createElement(
                    "option"
                );

            opcao.value =
                Number(
                    tamanho.preco
                );

            opcao.dataset.tamanho =
                tamanho.tamanho;

            opcao.textContent =
                tamanho.tamanho +
                " — " +
                dinheiro(
                    tamanho.preco
                );

            tamanhoMonte.appendChild(
                opcao
            );
        }
    );

    tamanhoMonte.onchange =
        calcularMontagem;
}


// ======================================
// CALCULAR MONTE SEU KE
// ======================================

function calcularMontagem() {

    const tamanhoMonte =
        document.getElementById(
            "tamanho-monte"
        );

    const totalMontagem =
        document.getElementById(
            "total-montagem"
        );

    if (
        !tamanhoMonte ||
        !totalMontagem ||
        tamanhoMonte.options.length === 0
    ) {

        return 0;
    }

    let total =
        Number(
            tamanhoMonte.value
        ) || 0;

    adicionais.forEach(
        function(adicional) {

            if (
                adicional.checked
            ) {

                total +=
                    Number(
                        adicional.value
                    ) || 0;
            }
        }
    );

    totalMontagem.innerText =
        dinheiro(total);

    return total;
}


// ======================================
// ADICIONAR MONTE SEU KE
// ======================================

const botaoMontado =
    document.getElementById(
        "adicionar-montado"
    );

if (botaoMontado) {

    botaoMontado.addEventListener(
        "click",
        function() {

            const tamanhoMonte =
                document.getElementById(
                    "tamanho-monte"
                );

            if (
                !tamanhoMonte ||
                tamanhoMonte.options.length === 0
            ) {

                alert(
                    "Escolha um tamanho. 💜"
                );

                return;
            }

            const opcao =
                tamanhoMonte.options[
                    tamanhoMonte.selectedIndex
                ];

            const tamanho =
                opcao.dataset.tamanho;

            const total =
                calcularMontagem();

            const listaAdicionais = [];

            adicionais.forEach(
                function(adicional) {

                    if (
                        adicional.checked
                    ) {

                        listaAdicionais.push({

                            nome:
                                adicional
                                    .dataset
                                    .nome,

                            preco:
                                Number(
                                    adicional.value
                                )
                        });
                    }
                }
            );

            carrinho.push({

                nome:
                    "Monte seu Ke",

                tamanho:
                    tamanho,

                adicionais:
                    listaAdicionais,

                preco:
                    total
            });

            recalcularCupom();

            atualizarCarrinho();

            alert(
                "Seu Ke foi adicionado ao carrinho! 💜"
            );

            adicionais.forEach(
                function(adicional) {

                    adicional.checked =
                        false;
                }
            );

            calcularMontagem();
        }
    );
}


// ======================================
// TOTAL BRUTO
// ======================================

function totalCarrinho() {

    return carrinho.reduce(
        function(soma, item) {

            return (
                soma +
                Number(
                    item.preco || 0
                )
            );
        },
        0
    );
}


// ======================================
// CUPOM
// ======================================

async function validarCupom() {

    const campo =
        document.getElementById(
            "codigo-cupom"
        );

    const mensagem =
        document.getElementById(
            "mensagem-cupom"
        );

    if (
        !campo ||
        !mensagem
    ) {
        return;
    }

    const codigo =
        campo.value
            .trim()
            .toUpperCase();

    if (!codigo) {

        mensagem.textContent =
            "Digite um cupom.";

        return;
    }

    const total =
        totalCarrinho();

    if (
        total <= 0
    ) {

        mensagem.textContent =
            "Adicione produtos ao carrinho primeiro.";

        return;
    }

    mensagem.textContent =
        "Validando cupom...";

    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "validar_cupom",
                {
                    p_codigo:
                        codigo,

                    p_total:
                        total
                }
            );

        if (error) {

            console.error(
                "Erro ao validar cupom:",
                error
            );

            mensagem.textContent =
                "Não foi possível validar o cupom.";

            return;
        }

        if (
            !data ||
            data.length === 0
        ) {

            cupomAplicado =
                null;

            valorDesconto =
                0;

            mensagem.textContent =
                "Cupom inválido ou não disponível.";

            atualizarCarrinho();

            return;
        }

        cupomAplicado =
            data[0];

        recalcularCupom();

        mensagem.textContent =
            "Cupom aplicado com sucesso! 💜";

        atualizarCarrinho();

    } catch (erro) {

        console.error(
            "Erro no cupom:",
            erro
        );

        mensagem.textContent =
            "Não foi possível validar o cupom.";
    }
}


// ======================================
// RECALCULAR CUPOM
// ======================================

function recalcularCupom() {

    const total =
        totalCarrinho();

    if (
        !cupomAplicado ||
        total <= 0
    ) {

        valorDesconto = 0;

        atualizarExibicaoCupom();

        return;
    }

    if (
        cupomAplicado.tipo ===
        "percentual"
    ) {

        valorDesconto =
            total *
            (
                Number(
                    cupomAplicado.valor
                ) / 100
            );

    } else {

        valorDesconto =
            Number(
                cupomAplicado.valor
            ) || 0;
    }

    if (
        valorDesconto > total
    ) {

        valorDesconto =
            total;
    }

    if (
        valorDesconto < 0
    ) {

        valorDesconto = 0;
    }

    atualizarExibicaoCupom();
}


// ======================================
// EXIBIR DESCONTO
// ======================================

function atualizarExibicaoCupom() {

    const elemento =
        document.getElementById(
            "valor-desconto"
        );

    if (!elemento) {
        return;
    }

    if (
        valorDesconto > 0
    ) {

        elemento.textContent =
            "-" +
            dinheiro(
                valorDesconto
            );

    } else {

        elemento.textContent =
            dinheiro(0);
    }
}


const botaoCupom =
    document.getElementById(
        "aplicar-cupom"
    );

if (botaoCupom) {

    botaoCupom.addEventListener(
        "click",
        validarCupom
    );
}


// ======================================
// CARRINHO
// ======================================

function atualizarCarrinho() {

    const area =
        document.getElementById(
            "itens-carrinho"
        );

    const vazio =
        document.getElementById(
            "carrinho-vazio"
        );

    const totalElemento =
        document.getElementById(
            "total-pedido"
        );

    if (
        !area ||
        !vazio ||
        !totalElemento
    ) {
        return;
    }

    area.innerHTML = "";

    const totalBruto =
        totalCarrinho();

    const totalFinal =
        Math.max(
            0,
            totalBruto -
            valorDesconto
        );

    if (
        carrinho.length === 0
    ) {

        vazio.style.display =
            "block";

    } else {

        vazio.style.display =
            "none";
    }

    carrinho.forEach(
        function(
            item,
            indice
        ) {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "item-carrinho";

            let textoAdicionais =
                "";

            if (
                item.adicionais &&
                item.adicionais.length > 0
            ) {

                textoAdicionais =
                    "<p>Adicionais: " +

                    item.adicionais
                        .map(
                            function(adicional) {

                                return escaparHTML(
                                    adicional.nome
                                );
                            }
                        )
                        .join(", ") +

                    "</p>";
            }

            div.innerHTML = `

                <div>

                    <h4>
                        ${escaparHTML(item.nome)}
                    </h4>

                    <p>
                        Tamanho:
                        ${escaparHTML(item.tamanho)}
                    </p>

                    ${textoAdicionais}

                </div>

                <div class="preco-item">

                    ${dinheiro(item.preco)}

                    <button
                        class="remover"
                        onclick="removerItem(${indice})"
                    >
                        Remover
                    </button>

                </div>

            `;

            area.appendChild(
                div
            );
        }
    );

    totalElemento.innerText =
        dinheiro(
            totalFinal
        );

    atualizarExibicaoCupom();
}


// ======================================
// REMOVER ITEM
// ======================================

function removerItem(indice) {

    carrinho.splice(
        indice,
        1
    );

    if (
        carrinho.length === 0
    ) {

        cupomAplicado =
            null;

        valorDesconto =
            0;

        const mensagem =
            document.getElementById(
                "mensagem-cupom"
            );

        if (mensagem) {

            mensagem.textContent =
                "";
        }

    } else {

        recalcularCupom();
    }

    atualizarCarrinho();
}


// ======================================
// PAGAMENTO
// ======================================

const pagamento =
    document.getElementById(
        "pagamento"
    );

const campoTroco =
    document.getElementById(
        "campo-troco"
    );

if (
    pagamento &&
    campoTroco
) {

    pagamento.addEventListener(
        "change",
        function() {

            if (
                pagamento.value ===
                "Dinheiro"
            ) {

                campoTroco.style.display =
                    "block";

            } else {

                campoTroco.style.display =
                    "none";
            }
        }
    );
}


// ======================================
// FINALIZAR PEDIDO
// ======================================

const botaoFinalizar =
    document.getElementById(
        "finalizar"
    );

if (botaoFinalizar) {

    botaoFinalizar.addEventListener(
        "click",
        function() {

            if (
                carrinho.length === 0
            ) {

                alert(
                    "Adicione pelo menos um açaí ao carrinho. 💜"
                );

                return;
            }

            const campoNome =
                document.getElementById(
                    "nome"
                );

            const campoTelefone =
                document.getElementById(
                    "telefone"
                );

            const campoRua =
                document.getElementById(
                    "rua"
                );

            const campoNumero =
                document.getElementById(
                    "numero"
                );

            const campoBairro =
                document.getElementById(
                    "bairro"
                );

            const campoComplemento =
                document.getElementById(
                    "complemento"
                );

            const campoTrocoInput =
                document.getElementById(
                    "troco"
                );

            const campoObservacao =
                document.getElementById(
                    "observacao"
                );

            const nome =
                campoNome
                    ? campoNome.value.trim()
                    : "";

            const telefone =
                campoTelefone
                    ? campoTelefone.value.trim()
                    : "";

            const rua =
                campoRua
                    ? campoRua.value.trim()
                    : "";

            const numero =
                campoNumero
                    ? campoNumero.value.trim()
                    : "";

            const bairro =
                campoBairro
                    ? campoBairro.value.trim()
                    : "";

            const complemento =
                campoComplemento
                    ? campoComplemento.value.trim()
                    : "";

            const formaPagamento =
                pagamento
                    ? pagamento.value
                    : "";

            const troco =
                campoTrocoInput
                    ? campoTrocoInput.value.trim()
                    : "";

            const observacao =
                campoObservacao
                    ? campoObservacao.value.trim()
                    : "";

            if (
                nome === "" ||
                telefone === "" ||
                rua === "" ||
                numero === "" ||
                bairro === "" ||
                formaPagamento === ""
            ) {

                alert(
                    "Preencha todos os campos obrigatórios da entrega. 💜"
                );

                return;
            }

            let mensagem =
                "💜 *NOVO PEDIDO - KE AÇAÍ* 💜\n\n";

            mensagem +=
                "👤 *Cliente:* " +
                nome +
                "\n";

            mensagem +=
                "📱 *Telefone:* " +
                telefone +
                "\n\n";

            mensagem +=
                "🛒 *PEDIDO*\n\n";

            let totalBruto = 0;

            carrinho.forEach(
                function(
                    item,
                    indice
                ) {

                    totalBruto +=
                        Number(
                            item.preco
                        );

                    mensagem +=
                        (indice + 1) +
                        ". *" +
                        item.nome +
                        "*\n";

                    mensagem +=
                        "🥤 " +
                        item.tamanho +
                        "\n";

                    if (
                        item.adicionais &&
                        item.adicionais.length > 0
                    ) {

                        mensagem +=
                            "➕ Adicionais:\n";

                        item.adicionais.forEach(
                            function(adicional) {

                                mensagem +=
                                    "   • " +
                                    adicional.nome +
                                    " (" +
                                    dinheiro(
                                        adicional.preco
                                    ) +
                                    ")\n";
                            }
                        );
                    }

                    mensagem +=
                        "💰 " +
                        dinheiro(
                            item.preco
                        ) +
                        "\n\n";
                }
            );

            mensagem +=
                "💵 *SUBTOTAL: " +
                dinheiro(
                    totalBruto
                ) +
                "*\n";

            if (
                cupomAplicado &&
                valorDesconto > 0
            ) {

                const codigoCupom =
                    cupomAplicado.codigo
                        ? cupomAplicado.codigo
                        : "Cupom";

                mensagem +=
                    "🎟️ *Cupom:* " +
                    codigoCupom +
                    "\n";

                mensagem +=
                    "💜 *Desconto:* -" +
                    dinheiro(
                        valorDesconto
                    ) +
                    "\n";
            }

            const totalFinal =
                Math.max(
                    0,
                    totalBruto -
                    valorDesconto
                );

            mensagem +=
                "💰 *TOTAL: " +
                dinheiro(
                    totalFinal
                ) +
                "*\n";

            mensagem +=
                "🛵 Taxa de entrega: a confirmar\n\n";

            mensagem +=
                "📍 *ENDEREÇO DE ENTREGA*\n";

            mensagem +=
                rua +
                ", " +
                numero +
                "\n";

            mensagem +=
                bairro +
                "\n";

            if (
                complemento !== ""
            ) {

                mensagem +=
                    "Complemento: " +
                    complemento +
                    "\n";
            }

            mensagem +=
                "\n💳 *Pagamento:* " +
                formaPagamento +
                "\n";

            if (
                formaPagamento ===
                    "Dinheiro" &&
                troco !== ""
            ) {

                mensagem +=
                    "💵 Troco para: " +
                    troco +
                    "\n";
            }

            if (
                observacao !== ""
            ) {

                mensagem +=
                    "\n📝 *Observação:* " +
                    observacao +
                    "\n";
            }

            mensagem +=
                "\n🛵 *PEDIDO PARA ENTREGA*";

            const texto =
                encodeURIComponent(
                    mensagem
                );

            const link =
                "https://wa.me/" +
                whatsapp +
                "?text=" +
                texto;

            window.open(
                link,
                "_blank"
            );
        }
    );
}


// ======================================
// INICIAR
// ======================================

atualizarCarrinho();
carregarCardapio();
