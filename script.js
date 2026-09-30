// ==========================================
// KE AÇAÍ - SITE DELIVERY
// ==========================================

const SUPABASE_URL = "https://ncukfroazgjnwvrmzxyu.supabase.co";
const SUPABASE_KEY = "sb_publishable_T9oyWTb31mxJybxM09Z81A_AoXqfdig";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// CONFIGURAÇÕES PADRÃO
let whatsapp = "5516996211605";
let taxaEntrega = 0;
let lojaAberta = true;

// DADOS
let produtos = [];
let tamanhos = [];
let adicionais = [];

let carrinho = [];

let cupomAplicado = null;
let valorDesconto = 0;


// ==========================================
// DINHEIRO
// ==========================================

function dinheiro(valor) {

    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


// ==========================================
// SEGURANÇA PARA TEXTOS
// ==========================================

function escapar(texto) {

    const div = document.createElement("div");

    div.textContent = texto ?? "";

    return div.innerHTML;

}


// ==========================================
// ÍCONES DOS PRODUTOS
// ==========================================

function iconeProduto(nome) {

    const n = String(nome || "").toLowerCase();

    if (n.includes("nutella")) {
        return "🍫";
    }

    if (n.includes("ninho")) {
        return "🥛";
    }

    if (n.includes("paçoca") || n.includes("pacoca")) {
        return "🥜";
    }

    if (n.includes("tradicional")) {
        return "🍓";
    }

    return "🍇";

}


// ==========================================
// CARREGAR CONFIGURAÇÕES
// ==========================================

async function carregarConfiguracoes() {

    try {

        const { data, error } = await supabaseClient
            .from("Configuracoes")
            .select("*")
            .limit(1)
            .maybeSingle();

        if (error) {
            console.log(
                "Configuração pública não disponível. Usando padrão.",
                error
            );

            return;
        }

        if (!data) {
            return;
        }

        if (data.whatsapp) {
            whatsapp = String(data.whatsapp).replace(/\D/g, "");
        }

        taxaEntrega = Number(data.taxa_entrega || 0);

        lojaAberta = data.loja_aberta !== false;


        const telefoneRodape =
            document.getElementById("telefone-rodape");

        if (telefoneRodape && data.whatsapp) {

            telefoneRodape.textContent =
                "Delivery • " + formatarTelefone(data.whatsapp);

        }


        const avisoTaxa =
            document.getElementById("aviso-taxa-entrega");

        if (avisoTaxa) {

            if (taxaEntrega > 0) {

                avisoTaxa.textContent =
                    "🛵 Taxa de entrega: " +
                    dinheiro(taxaEntrega);

            } else {

                avisoTaxa.textContent =
                    "🛵 Taxa de entrega a confirmar de acordo com o endereço.";

            }

        }


        if (!lojaAberta) {

            const aviso =
                document.getElementById("aviso-loja");

            aviso.style.display = "block";

            aviso.textContent =
                data.mensagem_fechado ||
                "No momento estamos fechados. 💜";

        }

    } catch (erro) {

        console.error(erro);

    }

}


function formatarTelefone(numero) {

    const numeros =
        String(numero || "").replace(/\D/g, "");

    let n = numeros;

    if (n.startsWith("55")) {
        n = n.substring(2);
    }

    if (n.length === 11) {

        return "(" +
            n.substring(0, 2) +
            ") " +
            n.substring(2, 7) +
            "-" +
            n.substring(7);

    }

    return numero;

}


// ==========================================
// CARREGAR CARDÁPIO
// ==========================================

async function carregarCardapio() {

    const listaProdutos =
        document.getElementById("lista-produtos");

    const listaAdicionais =
        document.getElementById("lista-adicionais");

    try {

        const resultadoProdutos =
            await supabaseClient
                .from("Produtos")
                .select("*")
                .eq("ativo", true)
                .order("ordem", {
                    ascending: true
                });


        if (resultadoProdutos.error) {
            throw resultadoProdutos.error;
        }


        const resultadoTamanhos =
            await supabaseClient
                .from("Tamanhos")
                .select("*")
                .eq("ativo", true)
                .order("ordem", {
                    ascending: true
                });


        if (resultadoTamanhos.error) {
            throw resultadoTamanhos.error;
        }


        const resultadoAdicionais =
            await supabaseClient
                .from("Adicionais")
                .select("*")
                .eq("ativo", true)
                .order("ordem", {
                    ascending: true
                });


        if (resultadoAdicionais.error) {
            throw resultadoAdicionais.error;
        }


        produtos =
            resultadoProdutos.data || [];

        tamanhos =
            resultadoTamanhos.data || [];

        adicionais =
            resultadoAdicionais.data || [];


        renderizarProdutos();

        renderizarMonte();

    } catch (erro) {

        console.error(
            "Erro ao carregar cardápio:",
            erro
        );

        listaProdutos.innerHTML =
            '<div class="carregando">' +
            'Não foi possível carregar o cardápio. 💜' +
            '</div>';

        listaAdicionais.innerHTML =
            '<div class="carregando">' +
            'Não foi possível carregar os adicionais.' +
            '</div>';

    }

}


// ==========================================
// MOSTRAR PRODUTOS
// ==========================================

function renderizarProdutos() {

    const lista =
        document.getElementById("lista-produtos");


    if (!produtos.length) {

        lista.innerHTML =
            '<div class="carregando">' +
            'Nenhum produto disponível no momento.' +
            '</div>';

        return;

    }


    lista.innerHTML = "";


    produtos.forEach(function(produto) {

        const tamanhosProduto =
            tamanhos.filter(function(tamanho) {

                return Number(tamanho.produto_id) ===
                    Number(produto.id);

            });


        if (!tamanhosProduto.length) {
            return;
        }


        const opcoes =
            tamanhosProduto.map(function(tamanho) {

                return `
                    <option value="${tamanho.id}">
                        ${escapar(tamanho.tamanho)}
                        — ${dinheiro(tamanho.preco)}
                    </option>
                `;

            }).join("");


        const card =
            document.createElement("div");

        card.className = "produto";

        card.innerHTML = `

            <div class="icone-produto">
                ${iconeProduto(produto.nome)}
            </div>

            <h3>
                ${escapar(produto.nome)}
            </h3>

            <p>
                ${escapar(produto.descricao || "")}
            </p>

            <select class="tamanho-produto">
                ${opcoes}
            </select>

            <button
                type="button"
                class="adicionar-produto"
            >
                Adicionar ao carrinho 🛒
            </button>

        `;


        const botao =
            card.querySelector(
                ".adicionar-produto"
            );


        botao.addEventListener(
            "click",
            function() {

                adicionarProdutoPronto(
                    produto,
                    card
                );

            }
        );


        lista.appendChild(card);

    });

}


// ==========================================
// ADICIONAR PRODUTO PRONTO
// ==========================================

function adicionarProdutoPronto(
    produto,
    card
) {

    const select =
        card.querySelector(
            ".tamanho-produto"
        );


    const tamanhoId =
        Number(select.value);


    const tamanho =
        tamanhos.find(function(item) {

            return Number(item.id) ===
                tamanhoId;

        });


    if (!tamanho) {

        alert(
            "Escolha um tamanho."
        );

        return;

    }


    carrinho.push({

        nome: produto.nome,

        tamanho: tamanho.tamanho,

        adicionais: [],

        preco: Number(tamanho.preco || 0),

        custo: Number(tamanho.custo || 0)

    });


    limparCupom();

    atualizarCarrinho();


    alert(
        produto.nome +
        " adicionado ao carrinho! 💜"
    );

}


// ==========================================
// MONTE SEU KE
// ==========================================

function renderizarMonte() {

    const select =
        document.getElementById(
            "tamanho-monte"
        );


    const lista =
        document.getElementById(
            "lista-adicionais"
        );


    // Usa os tamanhos do Ke Tradicional
    // como base do Monte seu Ke.

    let produtoBase =
        produtos.find(function(produto) {

            return String(produto.nome)
                .toLowerCase()
                .includes("tradicional");

        });


    if (!produtoBase && produtos.length) {
        produtoBase = produtos[0];
    }


    let tamanhosMonte = [];


    if (produtoBase) {

        tamanhosMonte =
            tamanhos.filter(function(tamanho) {

                return Number(tamanho.produto_id) ===
                    Number(produtoBase.id);

            });

    }


    if (!tamanhosMonte.length) {

        select.innerHTML =
            '<option value="">' +
            'Nenhum tamanho disponível' +
            '</option>';

    } else {

        select.innerHTML =
            tamanhosMonte
                .map(function(tamanho) {

                    return `
                        <option value="${tamanho.id}">
                            ${escapar(tamanho.tamanho)}
                            — ${dinheiro(tamanho.preco)}
                        </option>
                    `;

                })
                .join("");

    }


    if (!adicionais.length) {

        lista.innerHTML =
            '<div class="carregando">' +
            'Nenhum adicional disponível.' +
            '</div>';

    } else {

        lista.innerHTML = "";


        adicionais.forEach(
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
                            class="check-adicional"
                            value="${adicional.id}"
                        >

                        ${escapar(adicional.nome)}

                    </span>

                    <strong>
                        + ${dinheiro(adicional.preco)}
                    </strong>

                `;


                lista.appendChild(label);

            }
        );

    }


    select.onchange =
        calcularMontagem;


    document
        .querySelectorAll(
            ".check-adicional"
        )
        .forEach(function(check) {

            check.addEventListener(
                "change",
                calcularMontagem
            );

        });


    calcularMontagem();

}


// ==========================================
// CALCULAR MONTE SEU KE
// ==========================================

function calcularMontagem() {

    const select =
        document.getElementById(
            "tamanho-monte"
        );


    const tamanho =
        tamanhos.find(function(item) {

            return Number(item.id) ===
                Number(select.value);

        });


    let total =
        tamanho ?
            Number(tamanho.preco || 0)
            :
            0;


    document
        .querySelectorAll(
            ".check-adicional:checked"
        )
        .forEach(function(check) {

            const adicional =
                adicionais.find(
                    function(item) {

                        return Number(item.id) ===
                            Number(check.value);

                    }
                );


            if (adicional) {

                total +=
                    Number(
                        adicional.preco || 0
                    );

            }

        });


    document.getElementById(
        "total-montagem"
    ).textContent =
        dinheiro(total);

}


// ==========================================
// ADICIONAR MONTE SEU KE
// ==========================================

document
    .getElementById("adicionar-montado")
    .addEventListener(
        "click",
        function() {

            const select =
                document.getElementById(
                    "tamanho-monte"
                );


            const tamanho =
                tamanhos.find(
                    function(item) {

                        return Number(item.id) ===
                            Number(select.value);

                    }
                );


            if (!tamanho) {

                alert(
                    "Escolha um tamanho."
                );

                return;

            }


            const escolhidos = [];

            let preco =
                Number(
                    tamanho.preco || 0
                );

            let custo =
                Number(
                    tamanho.custo || 0
                );


            document
                .querySelectorAll(
                    ".check-adicional:checked"
                )
                .forEach(
                    function(check) {

                        const adicional =
                            adicionais.find(
                                function(item) {

                                    return Number(item.id) ===
                                        Number(check.value);

                                }
                            );


                        if (adicional) {

                            escolhidos.push({

                                nome:
                                    adicional.nome,

                                preco:
                                    Number(
                                        adicional.preco || 0
                                    )

                            });


                            preco +=
                                Number(
                                    adicional.preco || 0
                                );


                            custo +=
                                Number(
                                    adicional.custo || 0
                                );

                        }

                    }
                );


            carrinho.push({

                nome: "Monte seu Ke",

                tamanho:
                    tamanho.tamanho,

                adicionais:
                    escolhidos,

                preco: preco,

                custo: custo

            });


            document
                .querySelectorAll(
                    ".check-adicional"
                )
                .forEach(
                    function(check) {

                        check.checked = false;

                    }
                );


            limparCupom();

            calcularMontagem();

            atualizarCarrinho();


            alert(
                "Seu Ke foi adicionado ao carrinho! 💜"
            );

        }
    );


// ==========================================
// CARRINHO
// ==========================================

function atualizarCarrinho() {

    const lista =
        document.getElementById(
            "itens-carrinho"
        );


    const vazio =
        document.getElementById(
            "carrinho-vazio"
        );


    lista.innerHTML = "";


    if (!carrinho.length) {

        vazio.style.display = "block";

    } else {

        vazio.style.display = "none";

    }


    carrinho.forEach(
        function(item, indice) {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "item-carrinho";


            let adicionaisTexto = "";


            if (
                item.adicionais &&
                item.adicionais.length
            ) {

                adicionaisTexto =
                    "<p>+ " +
                    item.adicionais
                        .map(function(adicional) {

                            return escapar(
                                adicional.nome
                            );

                        })
                        .join(", ") +
                    "</p>";

            }


            div.innerHTML = `

                <div>

                    <h4>
                        ${escapar(item.nome)}
                    </h4>

                    <p>
                        ${escapar(item.tamanho)}
                    </p>

                    ${adicionaisTexto}

                </div>


                <div class="preco-item">

                    ${dinheiro(item.preco)}

                    <br>

                    <button
                        type="button"
                        class="remover"
                    >
                        Remover
                    </button>

                </div>

            `;


            div
                .querySelector(".remover")
                .addEventListener(
                    "click",
                    function() {

                        removerItem(indice);

                    }
                );


            lista.appendChild(div);

        }
    );


    const total =
        calcularSubtotal();


    if (
        valorDesconto >
        total
    ) {

        valorDesconto =
            total;

    }


    document.getElementById(
        "total-pedido"
    ).textContent =
        dinheiro(
            Math.max(
                0,
                total - valorDesconto
            )
        );


    document.getElementById(
        "valor-desconto"
    ).textContent =
        valorDesconto > 0
            ?
            "-" + dinheiro(valorDesconto)
            :
            dinheiro(0);

}


function calcularSubtotal() {

    return carrinho.reduce(
        function(soma, item) {

            return soma +
                Number(item.preco || 0);

        },
        0
    );

}


function calcularCusto() {

    return carrinho.reduce(
        function(soma, item) {

            return soma +
                Number(item.custo || 0);

        },
        0
    );

}


function removerItem(indice) {

    carrinho.splice(
        indice,
        1
    );


    limparCupom();

    atualizarCarrinho();

}


// ==========================================
// CUPOM
// ==========================================

async function validarCupom() {

    const campo =
        document.getElementById(
            "codigo-cupom"
        );


    const mensagem =
        document.getElementById(
            "mensagem-cupom"
        );


    const codigo =
        campo.value
            .trim()
            .toUpperCase();


    const total =
        calcularSubtotal();


    if (!codigo) {

        mensagem.textContent =
            "Digite um cupom.";

        return;

    }


    if (total <= 0) {

        mensagem.textContent =
            "Adicione produtos ao carrinho primeiro.";

        return;

    }


    mensagem.textContent =
        "Verificando cupom...";


    const { data, error } =
        await supabaseClient.rpc(
            "validar_cupom",
            {
                p_codigo: codigo,
                p_total: total
            }
        );


    if (error) {

        console.error(error);

        mensagem.textContent =
            "Não foi possível validar o cupom.";

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        cupomAplicado = null;

        valorDesconto = 0;


        mensagem.textContent =
            "Cupom inválido ou não disponível.";


        atualizarCarrinho();

        return;

    }


    const cupom =
        data[0];


    cupomAplicado =
        cupom;


    if (
        cupom.tipo ===
        "percentual"
    ) {

        valorDesconto =
            total *
            (
                Number(cupom.valor) /
                100
            );

    } else {

        valorDesconto =
            Number(cupom.valor);

    }


    valorDesconto =
        Math.min(
            valorDesconto,
            total
        );


    mensagem.textContent =
        "Cupom aplicado com sucesso! 💜";


    atualizarCarrinho();

}


function limparCupom() {

    cupomAplicado = null;

    valorDesconto = 0;


    const campo =
        document.getElementById(
            "codigo-cupom"
        );


    const mensagem =
        document.getElementById(
            "mensagem-cupom"
        );


    if (campo) {
        campo.value = "";
    }

    if (mensagem) {
        mensagem.textContent = "";
    }

}


document
    .getElementById("aplicar-cupom")
    .addEventListener(
        "click",
        validarCupom
    );


// ==========================================
// PAGAMENTO
// ==========================================

document
    .getElementById("pagamento")
    .addEventListener(
        "change",
        function() {

            const campoTroco =
                document.getElementById(
                    "campo-troco"
                );


            if (
                this.value ===
                "Dinheiro"
            ) {

                campoTroco.style.display =
                    "block";

            } else {

                campoTroco.style.display =
                    "none";

                document.getElementById(
                    "troco"
                ).value = "";

            }

        }
    );


// ==========================================
// REGISTRAR PEDIDO NO SUPABASE
// ==========================================

async function salvarPedido(dados) {

    try {

        const { error } =
            await supabaseClient.rpc(
                "criar_pedido",
                {
                    p_cliente:
                        dados.cliente,

                    p_telefone:
                        dados.telefone,

                    p_itens:
                        dados.itens,

                    p_valor_total:
                        dados.valorTotal,

                    p_custo:
                        dados.custo,

                    p_forma_pagamento:
                        dados.formaPagamento,

                    p_endereco:
                        dados.endereco,

                    p_taxa_entrega:
                        dados.taxaEntrega,

                    p_observacoes:
                        dados.observacoes
                }
            );


        if (error) {

            console.error(
                "Erro ao registrar pedido:",
                error
            );

        }

    } catch (erro) {

        console.error(
            "Erro ao registrar pedido:",
            erro
        );

    }

}


// ==========================================
// FINALIZAR PEDIDO
// ==========================================

document
    .getElementById("finalizar")
    .addEventListener(
        "click",
        function() {

            if (!lojaAberta) {

                alert(
                    "A Ke Açaí está fechada no momento. 💜"
                );

                return;

            }


            if (!carrinho.length) {

                alert(
                    "Seu carrinho está vazio."
                );

                return;

            }


            const nome =
                document
                    .getElementById("nome")
                    .value
                    .trim();


            const telefone =
                document
                    .getElementById("telefone")
                    .value
                    .trim();


            const rua =
                document
                    .getElementById("rua")
                    .value
                    .trim();


            const numero =
                document
                    .getElementById("numero")
                    .value
                    .trim();


            const bairro =
                document
                    .getElementById("bairro")
                    .value
                    .trim();


            const complemento =
                document
                    .getElementById("complemento")
                    .value
                    .trim();


            const formaPagamento =
                document
                    .getElementById("pagamento")
                    .value;


            const troco =
                document
                    .getElementById("troco")
                    .value
                    .trim();


            const observacao =
                document
                    .getElementById("observacao")
                    .value
                    .trim();


            if (
                !nome ||
                !telefone ||
                !rua ||
                !numero ||
                !bairro ||
                !formaPagamento
            ) {

                alert(
                    "Preencha todos os campos obrigatórios."
                );

                return;

            }


            const subtotal =
                calcularSubtotal();


            const totalProdutos =
                Math.max(
                    0,
                    subtotal -
                    valorDesconto
                );


            const totalFinal =
                totalProdutos +
                taxaEntrega;


            const custo =
                calcularCusto();


            const enderecoCompleto =
                rua +
                ", " +
                numero +
                " - " +
                bairro +
                (
                    complemento
                        ?
                        " - " + complemento
                        :
                        ""
                );


            // TEXTO DOS ITENS PARA O PAINEL

            const itensPedido =
                carrinho
                    .map(
                        function(item, indice) {

                            let texto =
                                (indice + 1) +
                                ". " +
                                item.nome +
                                " - " +
                                item.tamanho;


                            if (
                                item.adicionais &&
                                item.adicionais.length
                            ) {

                                texto +=
                                    " + " +
                                    item.adicionais
                                        .map(
                                            function(adicional) {

                                                return adicional.nome;

                                            }
                                        )
                                        .join(", ");

                            }


                            texto +=
                                " (" +
                                dinheiro(item.preco) +
                                ")";


                            return texto;

                        }
                    )
                    .join("\n");


            // MENSAGEM WHATSAPP

            let mensagem = "";

            mensagem +=
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


            carrinho.forEach(
                function(item, indice) {

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
                        item.adicionais.length
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
                        dinheiro(item.preco) +
                        "\n\n";

                }
            );


            mensagem +=
                "Subtotal: " +
                dinheiro(subtotal) +
                "\n";


            if (
                valorDesconto > 0 &&
                cupomAplicado
            ) {

                mensagem +=
                    "🎟️ *Cupom " +
                    cupomAplicado.codigo +
                    ": -" +
                    dinheiro(valorDesconto) +
                    "*\n";

            }


            mensagem +=
                "💵 *TOTAL DOS PRODUTOS: " +
                dinheiro(totalProdutos) +
                "*\n";


            if (taxaEntrega > 0) {

                mensagem +=
                    "🛵 Taxa de entrega: " +
                    dinheiro(taxaEntrega) +
                    "\n";


                mensagem +=
                    "💜 *TOTAL: " +
                    dinheiro(totalFinal) +
                    "*\n\n";

            } else {

                mensagem +=
                    "🛵 Taxa de entrega: a confirmar\n\n";

            }


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


            if (complemento) {

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
                troco
            ) {

                mensagem +=
                    "💵 Troco para: " +
                    troco +
                    "\n";

            }


            if (observacao) {

                mensagem +=
                    "\n📝 *Observação:* " +
                    observacao +
                    "\n";

            }


            mensagem +=
                "\n🛵 *PEDIDO PARA ENTREGA*";


            // IMPORTANTE:
            // ABRE O WHATSAPP PRIMEIRO.
            // ASSIM O NAVEGADOR NÃO BLOQUEIA.

            const link =
                "https://wa.me/" +
                whatsapp +
                "?text=" +
                encodeURIComponent(
                    mensagem
                );


            window.open(
                link,
                "_blank"
            );


            // SALVA DEPOIS, SEM BLOQUEAR O WHATSAPP

            salvarPedido({

                cliente: nome,

                telefone: telefone,

                itens: itensPedido,

                valorTotal: totalFinal,

                custo: custo,

                formaPagamento:
                    formaPagamento,

                endereco:
                    enderecoCompleto,

                taxaEntrega:
                    taxaEntrega,

                observacoes:
                    observacao || null

            });

        }
    );


// ==========================================
// INICIAR SITE
// ==========================================

async function iniciarSite() {

    atualizarCarrinho();

    await carregarConfiguracoes();

    await carregarCardapio();

}


iniciarSite();
