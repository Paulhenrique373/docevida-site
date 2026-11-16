import LegalPage from "../components/LegalPage";

// Texto-base elaborado pela equipe. Recomenda-se revisão por profissional jurídico antes da operação comercial.
const SECTIONS = [
    ["Sobre o site", ["Este site apresenta os doces da DoceVida e permite enviar pedidos. Ao usá-lo, você concorda com estes termos e com a nossa Política de Privacidade."]],
    ["Pedidos", ["O pedido enviado pelo site é uma solicitação: ele só é confirmado depois do contato da DoceVida. Valores, taxa de entrega, forma de pagamento, data e horário são combinados no atendimento.", "A disponibilidade dos produtos pode mudar. Se algum item não puder ser preparado, avisaremos e combinaremos uma alternativa com você.", "Alterações e cancelamentos devem ser combinados diretamente com a DoceVida, pelos canais de contato, o quanto antes."]],
    ["Produtos e informações", ["Nossos doces são feitos à mão, em pequenas quantidades, e podem ter pequenas variações de aparência. Alguns produtos podem conter ingredientes que causam alergia (como leite, glúten, ovos, castanhas e amendoim). Se você tem alguma alergia ou restrição, avise antes de fazer o pedido.", "As fotos do site são ilustrativas e podem não representar exatamente o produto final. As fotos oficiais serão publicadas quando estiverem disponíveis."]],
    ["Jogo Doces Match", ["O Doces Match é uma atividade de entretenimento. Moedas e conquistas do jogo não têm valor em dinheiro e não podem ser trocadas, a menos que a DoceVida divulgue regras específicas de brindes ou campanhas."]],
    ["Conteúdo do site", ["Textos, imagens, nome e logo da DoceVida pertencem à empresa. Não é permitido copiá-los ou usá-los comercialmente sem autorização."]],
    ["Uso adequado", ["Pedimos que você informe dados verdadeiros e não use o site para atrapalhar seu funcionamento ou o de outras pessoas."]],
    ["Links externos", ["O site pode ter links para serviços de terceiros, como Instagram e Google Forms. Não controlamos o conteúdo deles."]],
    ["Mudanças e contato", ["Podemos atualizar estes termos quando necessário. Estes termos seguem as leis do Brasil.", "@contato"]],
];

export default function Termos() {
    return <LegalPage title="Termos de Uso" description="Regras para usar o site e fazer pedidos na DoceVida." updated="novembro de 2026" sections={SECTIONS} />;
}
