// Seed idempotente do FisioCase.
// Cria usuários (1 ADMIN + 2 USER), 10 casos clínicos publicados,
// 5 conquistas e 3 missões diárias. Reexecutar não duplica dados.
//
// Rodar com: npm run seed
import bcrypt from 'bcryptjs';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('senha123', 10);

  // ───────────────────────── Usuários ─────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fisiocase.com' },
    update: {},
    create: {
      nome: 'Administrador FisioCase',
      email: 'admin@fisiocase.com',
      senha: senhaHash,
      role: 'ADMIN',
      instituicao: 'FisioCase',
      nivel: 'Mestre',
      xpTotal: 6500,
      xpAtual: 6500,
      sequenciaAtual: 12,
      maiorSequencia: 30,
    },
  });

  const aluno = await prisma.user.upsert({
    where: { email: 'aluno@fisiocase.com' },
    update: {},
    create: {
      nome: 'João Aluno',
      email: 'aluno@fisiocase.com',
      senha: senhaHash,
      role: 'USER',
      instituicao: 'Universidade Federal',
      semestre: 6,
      nivel: 'Estudante', // 501–1500
      xpTotal: 1200,
      xpAtual: 1200,
      sequenciaAtual: 3,
      maiorSequencia: 8,
    },
  });

  const maria = await prisma.user.upsert({
    where: { email: 'maria@fisiocase.com' },
    update: {},
    create: {
      nome: 'Maria Residente',
      email: 'maria@fisiocase.com',
      senha: senhaHash,
      role: 'USER',
      instituicao: 'Hospital Universitário',
      semestre: 10,
      nivel: 'Residente', // 1501–3000
      xpTotal: 2400,
      xpAtual: 2400,
      sequenciaAtual: 5,
      maiorSequencia: 15,
    },
  });

  // ───────────────────────── Casos ─────────────────────────
  // Helper para criar/atualizar caso de forma idempotente (busca por título).
  async function upsertCaso(data: Prisma.CasoCreateInput, titulo: string) {
    const existente = await prisma.caso.findFirst({ where: { titulo } });
    if (existente) {
      return prisma.caso.update({ where: { id: existente.id }, data });
    }
    return prisma.caso.create({ data });
  }

  const autorConnect = { connect: { id: admin.id } };

  const casos: Array<{ titulo: string; data: Prisma.CasoCreateInput }> = [
    {
      titulo: 'Lombalgia mecânica em trabalhador braçal',
      data: {
        titulo: 'Lombalgia mecânica em trabalhador braçal',
        area: 'ORTOPEDIA',
        dificuldade: 'FACIL',
        tipoPaciente: 'ADULTO',
        focoClinico: 'AVALIACAO',
        identificacao: { nome: 'Carlos Souza', idade: 38, sexo: 'Masculino', profissao: 'Pedreiro', estadoCivil: 'Casado' },
        queixaPrincipal: 'Dor lombar há 2 semanas após levantar peso no trabalho.',
        historiaDoencaAtual:
          'Paciente refere dor lombar baixa de início agudo após levantar carga pesada de forma inadequada. Dor pioora ao flexionar o tronco e melhora em repouso. Nega irradiação para membros inferiores, parestesias ou perda de força. Sem alterações de esfíncteres.',
        historicoPatologico: ['Episódios prévios de lombalgia leve', 'Sedentarismo', 'Tabagista (10 cigarros/dia)'],
        exameFisico: {
          pa: '120/80 mmHg',
          fc: '72 bpm',
          fr: '16 irpm',
          spo2: '98%',
          achados: 'Contratura paravertebral lombar bilateral, dor à palpação de L4-L5, Lasègue negativo, ADM de flexão de tronco reduzida por dor, força e reflexos preservados.',
        },
        examesComplementares: [{ tipo: 'Radiografia de coluna lombar', resultado: 'Sem alterações ósseas significativas, leve retificação da lordose lombar.' }],
        respostaEsperada:
          'Trata-se de lombalgia mecânica aguda inespecífica sem sinais de alerta (red flags). Conduta: orientação para manter atividade dentro do tolerado (evitar repouso absoluto), educação postural e ergonômica, crioterapia/termoterapia para alívio sintomático, exercícios de estabilização do core e mobilidade lombar progressivos, alongamento de cadeia posterior. Orientar técnica correta de levantamento de cargas. Reavaliar em 7-14 dias.',
        criteriosAvaliacao: { itens: ['Identificar ausência de red flags', 'Indicar manutenção de atividade', 'Propor exercícios de estabilização', 'Educação ergonômica'] },
        xpRecompensa: 160,
        status: 'PUBLICADO',
        autor: autorConnect,
      },
    },
    {
      titulo: 'Hemiparesia pós-AVC isquêmico em fase subaguda',
      data: {
        titulo: 'Hemiparesia pós-AVC isquêmico em fase subaguda',
        area: 'NEUROLOGIA',
        dificuldade: 'DIFICIL',
        tipoPaciente: 'IDOSO',
        focoClinico: 'REABILITACAO',
        identificacao: { nome: 'Antônio Pereira', idade: 68, sexo: 'Masculino', profissao: 'Aposentado', estadoCivil: 'Viúvo' },
        queixaPrincipal: 'Fraqueza no lado direito do corpo após derrame há 3 semanas.',
        historiaDoencaAtual:
          'Paciente com AVC isquêmico em território de artéria cerebral média esquerda há 21 dias, evoluindo com hemiparesia à direita de predomínio braquial e afasia de expressão leve. Encaminhado para reabilitação. Apresenta tônus aumentado em flexores de punho e dedos (Ashworth 1+).',
        historicoPatologico: ['Hipertensão arterial sistêmica', 'Fibrilação atrial', 'Diabetes mellitus tipo 2'],
        exameFisico: {
          pa: '140/85 mmHg',
          fc: '78 bpm (irregular)',
          fr: '18 irpm',
          spo2: '96%',
          achados: 'Força grau 3 em MSD e grau 4 em MID, hipertonia espástica em flexores de punho/dedos (Ashworth 1+), reflexos profundos exaltados à direita, Babinski presente à direita, sensibilidade tátil preservada, marcha com padrão ceifante.',
        },
        examesComplementares: [
          { tipo: 'Tomografia de crânio', resultado: 'Área de hipodensidade em território de ACM esquerda compatível com isquemia.' },
          { tipo: 'Escala NIHSS', resultado: 'Pontuação 8 (déficit moderado).' },
        ],
        respostaEsperada:
          'Reabilitação neurofuncional baseada em neuroplasticidade. Conduta: treino orientado à tarefa e prática repetitiva intensiva para MSD, terapia de contensão induzida quando apropriado, mobilização precoce e treino de marcha com apoio progressivo, fortalecimento de MID, manejo da espasticidade com alongamento e posicionamento, treino de equilíbrio e transferências, estimulação da funcionalidade em AVDs. Trabalho interdisciplinar (fono para afasia). Controle de fatores de risco em conjunto com a equipe médica.',
        criteriosAvaliacao: { itens: ['Treino orientado à tarefa', 'Manejo de espasticidade', 'Treino de marcha e equilíbrio', 'Abordagem interdisciplinar'] },
        xpRecompensa: 320,
        status: 'PUBLICADO',
        autor: autorConnect,
      },
    },
    {
      titulo: 'DPOC exacerbada com retenção de secreção',
      data: {
        titulo: 'DPOC exacerbada com retenção de secreção',
        area: 'CARDIORRESPIRATORIA',
        dificuldade: 'MEDIO',
        tipoPaciente: 'IDOSO',
        focoClinico: 'CONDUTA',
        identificacao: { nome: 'Sebastião Lima', idade: 71, sexo: 'Masculino', profissao: 'Ex-motorista', estadoCivil: 'Casado' },
        queixaPrincipal: 'Falta de ar e tosse com catarro espesso há 4 dias.',
        historiaDoencaAtual:
          'Paciente com DPOC conhecido apresenta exacerbação com aumento da dispneia, tosse produtiva com secreção mucopurulenta e dificuldade de eliminação. Internado em enfermaria, em uso de broncodilatador e antibioticoterapia. Refere cansaço aos mínimos esforços.',
        historicoPatologico: ['DPOC GOLD III', 'Ex-tabagista (40 maços-ano)', 'Hipertensão arterial'],
        exameFisico: {
          pa: '130/82 mmHg',
          fc: '92 bpm',
          fr: '26 irpm',
          spo2: '90% em ar ambiente',
          achados: 'Tórax em tonel, uso de musculatura acessória, murmúrio vesicular diminuído com roncos e sibilos difusos, tempo expiratório prolongado, secreção espessa de difícil eliminação.',
        },
        examesComplementares: [
          { tipo: 'Gasometria arterial', resultado: 'pH 7,34 / PaCO2 52 mmHg / PaO2 60 mmHg (acidose respiratória compensada).' },
          { tipo: 'Radiografia de tórax', resultado: 'Hiperinsuflação pulmonar, sem consolidações.' },
        ],
        respostaEsperada:
          'Fisioterapia respiratória focada em higiene brônquica e otimização ventilatória. Conduta: técnicas de remoção de secreção (ciclo ativo da respiração, expiração lenta total com glote aberta - ELTGOL, drenagem autógena), hidratação/umidificação das vias aéreas, vibrocompressão e tosse assistida/dirigida. Reeducação do padrão respiratório (respiração com lábios semicerrados, freno labial), posicionamento para alívio da dispneia. Oxigenoterapia conforme prescrição mantendo SpO2 alvo 88-92%. Reabilitação pulmonar e treino de exercício após estabilização.',
        criteriosAvaliacao: { itens: ['Técnicas de higiene brônquica', 'Reeducação do padrão respiratório', 'Alvo de SpO2 adequado para DPOC', 'Reabilitação pulmonar'] },
        xpRecompensa: 240,
        status: 'PUBLICADO',
        autor: autorConnect,
      },
    },
    {
      titulo: 'Entorse de tornozelo grau II em jogador de futebol',
      data: {
        titulo: 'Entorse de tornozelo grau II em jogador de futebol',
        area: 'ESPORTIVA',
        dificuldade: 'MEDIO',
        tipoPaciente: 'ATLETA',
        focoClinico: 'REABILITACAO',
        identificacao: { nome: 'Lucas Ferreira', idade: 24, sexo: 'Masculino', profissao: 'Jogador de futebol', estadoCivil: 'Solteiro' },
        queixaPrincipal: 'Torci o tornozelo em jogo há 5 dias, está inchado e dói para pisar.',
        historiaDoencaAtual:
          'Atleta sofreu mecanismo de inversão forçada do tornozelo direito durante partida. Apresentou edema imediato e dor lateral. Realizou protocolo PRICE nas primeiras 48h. Atualmente com edema em redução, dor à deambulação e limitação funcional. Sem fraturas ao exame de imagem.',
        historicoPatologico: ['Entorse prévia do mesmo tornozelo há 1 ano', 'Sem comorbidades'],
        exameFisico: {
          pa: '118/76 mmHg',
          fc: '64 bpm',
          fr: '14 irpm',
          spo2: '99%',
          achados: 'Edema e equimose periomaleolar lateral, dor à palpação do ligamento talofibular anterior, teste da gaveta anterior com leve aumento de translação, ADM de dorsiflexão e eversão limitadas por dor, apoio com claudicação.',
        },
        examesComplementares: [{ tipo: 'Radiografia de tornozelo (critérios de Ottawa)', resultado: 'Sem evidência de fratura.' }],
        respostaEsperada:
          'Reabilitação progressiva de entorse lateral grau II por fases. Fase aguda: controle de edema/dor (crioterapia, compressão, elevação), mobilização precoce protegida, ADM ativa indolor. Fase subaguda: fortalecimento de fibulares e musculatura intrínseca, exercícios de mobilidade, propriocepção em superfície estável progredindo para instável. Fase de retorno ao esporte: treino neuromuscular, pliometria, exercícios específicos do gesto esportivo, agilidade e mudanças de direção. Uso de bandagem/órtese funcional na transição. Critérios de retorno baseados em força, equilíbrio e testes funcionais simétricos.',
        criteriosAvaliacao: { itens: ['Reabilitação por fases', 'Fortalecimento de fibulares', 'Treino proprioceptivo progressivo', 'Critérios de retorno ao esporte'] },
        xpRecompensa: 240,
        status: 'PUBLICADO',
        autor: autorConnect,
      },
    },
    {
      titulo: 'Risco de quedas em idosa com sarcopenia',
      data: {
        titulo: 'Risco de quedas em idosa com sarcopenia',
        area: 'GERONTOLOGIA',
        dificuldade: 'MEDIO',
        tipoPaciente: 'IDOSO',
        focoClinico: 'PREVENCAO',
        identificacao: { nome: 'Dona Cecília Andrade', idade: 79, sexo: 'Feminino', profissao: 'Aposentada', estadoCivil: 'Viúva' },
        queixaPrincipal: 'Está com medo de cair, sente as pernas fracas e já quase caiu duas vezes.',
        historiaDoencaAtual:
          'Idosa relata fraqueza progressiva de membros inferiores, instabilidade postural e dois episódios de quase-queda no último mês. Diminuiu suas atividades por medo de cair. Mora sozinha em casa com escadas. Perda de peso não intencional recente.',
        historicoPatologico: ['Osteoporose', 'Hipertensão arterial controlada', 'Catarata (operada à direita)'],
        exameFisico: {
          pa: '138/84 mmHg',
          fc: '70 bpm',
          fr: '16 irpm',
          spo2: '97%',
          achados: 'Redução de força em MMII (grau 4), redução de massa muscular, Timed Up and Go 16 segundos, teste de equilíbrio unipodal < 5s, marcha lenta com base alargada, força de preensão palmar reduzida.',
        },
        examesComplementares: [
          { tipo: 'Densitometria óssea', resultado: 'T-score -2,8 em coluna lombar (osteoporose).' },
          { tipo: 'Escala de Berg', resultado: 'Pontuação 38 (risco moderado de quedas).' },
        ],
        respostaEsperada:
          'Programa multifatorial de prevenção de quedas. Conduta: treino de força progressivo para MMII (especialmente quadríceps e glúteos), treino de equilíbrio estático e dinâmico, exercícios funcionais e de dupla tarefa, treino de marcha, exercícios de transferência. Orientação sobre adaptações ambientais e segurança domiciliar (remover tapetes, barras de apoio, iluminação, corrimão na escada). Atividade aeróbica de baixo impacto. Educação quanto ao manejo da osteoporose e prevenção de fraturas. Avaliação de calçado adequado. Encaminhamento para avaliação nutricional pela perda de peso/sarcopenia.',
        criteriosAvaliacao: { itens: ['Treino de força e equilíbrio', 'Adaptações ambientais', 'Abordagem da sarcopenia', 'Educação em segurança'] },
        xpRecompensa: 240,
        status: 'PUBLICADO',
        autor: autorConnect,
      },
    },
    {
      titulo: 'Atraso do desenvolvimento motor em lactente',
      data: {
        titulo: 'Atraso do desenvolvimento motor em lactente',
        area: 'PEDIATRIA',
        dificuldade: 'DIFICIL',
        tipoPaciente: 'PEDIATRICO',
        focoClinico: 'DIAGNOSTICO',
        identificacao: { nome: 'Bebê Heitor', idade: '10 meses', sexo: 'Masculino', profissao: 'Lactente', estadoCivil: 'N/A' },
        queixaPrincipal: 'Mãe relata que o bebê ainda não senta sozinho e parece "molinho".',
        historiaDoencaAtual:
          'Lactente de 10 meses, nascido prematuro (32 semanas), com história de internação em UTI neonatal. Mãe observa que não sustenta o tronco sentado sem apoio, não engatinha e apresenta hipotonia generalizada. Sorriso social presente, segue objetos com o olhar.',
        historicoPatologico: ['Prematuridade (32 semanas)', 'Baixo peso ao nascer', 'Internação em UTI neonatal por 3 semanas'],
        exameFisico: {
          pa: '90/55 mmHg',
          fc: '120 bpm',
          fr: '30 irpm',
          spo2: '98%',
          achados: 'Hipotonia axial e apendicular, controle cervical parcial, não senta sem apoio, reação de proteção lateral incompleta, reflexos primitivos sem persistências patológicas evidentes, contato visual e social adequado.',
        },
        examesComplementares: [
          { tipo: 'Escala AIMS (Alberta Infant Motor Scale)', resultado: 'Percentil abaixo de 5 para a idade corrigida.' },
          { tipo: 'Avaliação neuropediátrica', resultado: 'Atraso motor a esclarecer, sem sinais focais.' },
        ],
        respostaEsperada:
          'Avaliação considerando idade corrigida pela prematuridade. Conduta de estimulação precoce do desenvolvimento neuropsicomotor: facilitação do controle de tronco e da postura sentada, atividades em prono para fortalecimento de extensores e descarga de peso em MMSS, estímulo às reações de equilíbrio e proteção, transferências de peso, estímulo ao engatinhar e ao deslocamento. Uso do brincar dirigido e orientação aos pais para estimulação no domicílio. Acompanhamento longitudinal do desenvolvimento e abordagem interdisciplinar. Monitorar sinais de paralisia cerebral.',
        criteriosAvaliacao: { itens: ['Uso da idade corrigida', 'Estimulação precoce do DNPM', 'Orientação aos pais', 'Acompanhamento longitudinal'] },
        xpRecompensa: 320,
        status: 'PUBLICADO',
        autor: autorConnect,
      },
    },
    {
      titulo: 'Incontinência urinária de esforço no pós-parto',
      data: {
        titulo: 'Incontinência urinária de esforço no pós-parto',
        area: 'UROGINECOLOGIA',
        dificuldade: 'MEDIO',
        tipoPaciente: 'ADULTO',
        focoClinico: 'CONDUTA',
        identificacao: { nome: 'Fernanda Costa', idade: 31, sexo: 'Feminino', profissao: 'Professora', estadoCivil: 'Casada' },
        queixaPrincipal: 'Perco urina quando tusso, espirro ou faço esforço, desde o parto há 4 meses.',
        historiaDoencaAtual:
          'Paciente no pós-parto de 4 meses (parto vaginal de bebê grande, com episiotomia) relata perdas urinárias aos esforços (tosse, espirro, exercício). Nega urgência miccional ou perdas em repouso. Refere sensação de peso vaginal leve. Amamentando.',
        historicoPatologico: ['Parto vaginal recente com macrossomia fetal', 'Sem incontinência prévia'],
        exameFisico: {
          pa: '110/70 mmHg',
          fc: '74 bpm',
          fr: '15 irpm',
          spo2: '99%',
          achados: 'Avaliação do assoalho pélvico: contração de musculatura grau 2 (Oxford modificada), fraca sustentação, teste de esforço positivo com perda urinária à tosse, sem prolapso significativo, boa percepção da musculatura após orientação.',
        },
        examesComplementares: [{ tipo: 'Diário miccional', resultado: 'Perdas associadas a esforço, sem episódios de urgência.' }],
        respostaEsperada:
          'Diagnóstico de incontinência urinária de esforço por disfunção do assoalho pélvico no pós-parto. Conduta: treinamento da musculatura do assoalho pélvico (exercícios de Kegel) com progressão de contrações lentas (sustentadas) e rápidas, idealmente com biofeedback para garantir contração correta. Treino do "knack" (contração reflexa antes do esforço), educação sobre hábitos miccionais e evitar manobras que aumentam a pressão intra-abdominal. Conscientização perineal. Progressão funcional integrando a contração às atividades de vida diária e exercício. Reavaliação periódica da força e da queixa.',
        criteriosAvaliacao: { itens: ['Treinamento do assoalho pélvico', 'Uso do knack', 'Biofeedback/conscientização perineal', 'Educação em hábitos miccionais'] },
        xpRecompensa: 240,
        status: 'PUBLICADO',
        autor: autorConnect,
      },
    },
    {
      titulo: 'Artrite reumatoide com acometimento de mãos',
      data: {
        titulo: 'Artrite reumatoide com acometimento de mãos',
        area: 'REUMATOLOGIA',
        dificuldade: 'DIFICIL',
        tipoPaciente: 'ADULTO',
        focoClinico: 'CONDUTA',
        identificacao: { nome: 'Rosa Martins', idade: 52, sexo: 'Feminino', profissao: 'Costureira', estadoCivil: 'Casada' },
        queixaPrincipal: 'Dor e rigidez nas mãos pela manhã, com dificuldade para fechar os dedos.',
        historiaDoencaAtual:
          'Paciente com diagnóstico de artrite reumatoide há 3 anos, em uso de metotrexato. Apresenta rigidez matinal prolongada (cerca de 90 minutos), dor e edema em articulações metacarpofalângicas e interfalângicas proximais bilaterais, com limitação funcional importante para AVDs e atividade laboral.',
        historicoPatologico: ['Artrite reumatoide soropositiva', 'Hipotireoidismo', 'Anemia leve'],
        exameFisico: {
          pa: '124/78 mmHg',
          fc: '76 bpm',
          fr: '16 irpm',
          spo2: '98%',
          achados: 'Edema e dor em MCFs e IFPs bilaterais, rigidez matinal prolongada, início de desvio ulnar em dedos, redução de força de preensão e pinça, limitação de ADM de punhos e dedos, sem deformidades fixas graves.',
        },
        examesComplementares: [
          { tipo: 'Fator reumatoide e anti-CCP', resultado: 'Ambos positivos.' },
          { tipo: 'Radiografia de mãos', resultado: 'Redução de espaço articular e erosões marginais incipientes.' },
        ],
        respostaEsperada:
          'Abordagem fisioterapêutica respeitando a atividade da doença. Conduta: em fase aguda/inflamatória, repouso relativo articular, crioterapia, exercícios isométricos suaves e mobilização ativa-assistida dentro do indolor para preservar ADM. Em fase de controle, fortalecimento progressivo suave, exercícios de ADM e manutenção da função da mão, alongamentos. Conservação de energia e proteção articular (orientações ergonômicas, evitar sobrecarga, uso de órteses de repouso/funcionais para punho e dedos). Termoterapia para alívio da rigidez matinal. Educação sobre a doença e adaptação das atividades laborais. Trabalho conjunto com a equipe reumatológica.',
        criteriosAvaliacao: { itens: ['Respeitar fase inflamatória vs controle', 'Proteção articular e órteses', 'Conservação de energia', 'Manutenção de ADM e função da mão'] },
        xpRecompensa: 320,
        status: 'PUBLICADO',
        autor: autorConnect,
      },
    },
    {
      titulo: 'Cervicalgia tensional em profissional de escritório',
      data: {
        titulo: 'Cervicalgia tensional em profissional de escritório',
        area: 'ORTOPEDIA',
        dificuldade: 'FACIL',
        tipoPaciente: 'ADULTO',
        focoClinico: 'AVALIACAO',
        identificacao: { nome: 'Patrícia Gomes', idade: 34, sexo: 'Feminino', profissao: 'Analista de sistemas', estadoCivil: 'Solteira' },
        queixaPrincipal: 'Dor no pescoço e ombros no fim do dia de trabalho, com dor de cabeça.',
        historiaDoencaAtual:
          'Paciente refere dor cervical posterior e em trapézios, de caráter tensional, que piora ao longo do dia em frente ao computador. Associa cefaleia tensional ocasional. Trabalha cerca de 9 horas sentada com postura inadequada. Nega irradiação para membros superiores, parestesias ou perda de força.',
        historicoPatologico: ['Sem comorbidades relevantes', 'Sedentarismo', 'Estresse ocupacional'],
        exameFisico: {
          pa: '116/74 mmHg',
          fc: '70 bpm',
          fr: '15 irpm',
          spo2: '99%',
          achados: 'Postura de protração de cabeça e ombros, hipertonia e pontos-gatilho em trapézio superior e elevador da escápula, dor à palpação cervical posterior, ADM cervical levemente reduzida em rotação, testes neurológicos de MMSS normais.',
        },
        examesComplementares: [{ tipo: 'Avaliação postural / ergonômica do posto de trabalho', resultado: 'Monitor abaixo da linha dos olhos, ausência de apoio lombar adequado.' }],
        respostaEsperada:
          'Cervicalgia mecânica/tensional de origem postural e ocupacional. Conduta: educação postural e correção ergonômica do posto de trabalho (altura do monitor, apoio lombar, posição do teclado/mouse, pausas ativas), terapia manual e liberação miofascial de trapézio/elevador da escápula, alongamento da musculatura cervical e do peitoral, fortalecimento de flexores profundos do pescoço e estabilizadores escapulares, exercícios de mobilidade cervical. Orientação de exercícios e pausas durante a jornada. Manejo do estresse. Termoterapia para alívio sintomático.',
        criteriosAvaliacao: { itens: ['Identificar origem postural/ocupacional', 'Correção ergonômica', 'Fortalecimento de flexores profundos', 'Educação e pausas ativas'] },
        xpRecompensa: 160,
        status: 'PUBLICADO',
        autor: autorConnect,
      },
    },
    {
      titulo: 'Reabilitação pós-operatória de LCA em corredora',
      data: {
        titulo: 'Reabilitação pós-operatória de LCA em corredora',
        area: 'ESPORTIVA',
        dificuldade: 'DIFICIL',
        tipoPaciente: 'ATLETA',
        focoClinico: 'REABILITACAO',
        identificacao: { nome: 'Camila Rocha', idade: 27, sexo: 'Feminino', profissao: 'Corredora amadora / publicitária', estadoCivil: 'Solteira' },
        queixaPrincipal: 'Operei o joelho do ligamento cruzado há 6 semanas e quero voltar a correr.',
        historiaDoencaAtual:
          'Paciente no 6º semana de pós-operatório de reconstrução do ligamento cruzado anterior (enxerto de tendão patelar) do joelho esquerdo. Apresenta evolução adequada, deambula sem muletas, com leve déficit de extensão terminal e fraqueza de quadríceps. Refere insegurança e deseja retornar à corrida.',
        historicoPatologico: ['Reconstrução de LCA há 6 semanas', 'Sem comorbidades'],
        exameFisico: {
          pa: '112/72 mmHg',
          fc: '60 bpm',
          fr: '14 irpm',
          spo2: '99%',
          achados: 'ADM de 0-5° de extensão (déficit terminal) a 120° de flexão, edema residual leve, atrofia de quadríceps com déficit de força (grau 4), controle neuromuscular reduzido, marcha funcional sem claudicação, teste de Lachman estável.',
        },
        examesComplementares: [
          { tipo: 'Avaliação isocinética', resultado: 'Déficit de força de extensores de joelho de aproximadamente 30% em relação ao lado contralateral.' },
          { tipo: 'Hop tests', resultado: 'Simetria abaixo de 80% (não apto a impacto pleno).' },
        ],
        respostaEsperada:
          'Reabilitação pós-LCA baseada em critérios, por fases. Fase atual (subaguda): recuperar extensão terminal completa, controle de edema, fortalecimento progressivo de quadríceps (cadeia fechada e aberta dentro de faixas seguras), trabalho de glúteos e core, treino proprioceptivo e neuromuscular, bicicleta/condicionamento. Progressão para fase avançada: fortalecimento intensivo, pliometria controlada, treino de corrida progressivo apenas após critérios mínimos (ADM completa, força/simetria adequadas, ausência de dor/edema). Retorno ao esporte guiado por baterias de testes funcionais (hop tests com simetria >90%), força isocinética simétrica e confiança psicológica. Prevenção de relesão com treino neuromuscular contínuo.',
        criteriosAvaliacao: { itens: ['Recuperar extensão terminal', 'Fortalecimento progressivo de quadríceps/glúteos', 'Progressão por critérios (não por tempo)', 'Testes funcionais para retorno à corrida'] },
        xpRecompensa: 320,
        status: 'PUBLICADO',
        autor: autorConnect,
      },
    },
  ];

  for (const c of casos) {
    await upsertCaso(c.data, c.titulo);
  }

  // ───────────────────────── Conquistas ─────────────────────────
  // Idempotência por título.
  async function upsertConquista(data: Prisma.ConquistaCreateInput) {
    const existente = await prisma.conquista.findFirst({ where: { titulo: data.titulo } });
    if (existente) {
      return prisma.conquista.update({ where: { id: existente.id }, data });
    }
    return prisma.conquista.create({ data });
  }

  await upsertConquista({
    titulo: 'Primeiro Passo',
    descricao: 'Resolva o seu primeiro caso clínico.',
    icone: 'Footprints',
    xpRecompensa: 50,
    requisito: { tipo: 'casos_resolvidos', meta: 1 },
  });
  await upsertConquista({
    titulo: 'Em Forma',
    descricao: 'Resolva 5 casos clínicos.',
    icone: 'Dumbbell',
    xpRecompensa: 150,
    requisito: { tipo: 'casos_resolvidos', meta: 5 },
  });
  await upsertConquista({
    titulo: 'Dedicado',
    descricao: 'Resolva 20 casos clínicos.',
    icone: 'Award',
    xpRecompensa: 400,
    requisito: { tipo: 'casos_resolvidos', meta: 20 },
  });
  await upsertConquista({
    titulo: 'Sequência de Fogo',
    descricao: 'Mantenha uma sequência de 7 dias resolvendo casos.',
    icone: 'Flame',
    xpRecompensa: 300,
    requisito: { tipo: 'sequencia', meta: 7 },
  });
  await upsertConquista({
    titulo: 'Perfeição',
    descricao: 'Obtenha a nota máxima (100) em um caso.',
    icone: 'Star',
    xpRecompensa: 250,
    requisito: { tipo: 'nota_perfeita' },
  });
  await upsertConquista({
    titulo: 'Mestre do Saber',
    descricao: 'Resolva 50 casos clínicos.',
    icone: 'GraduationCap',
    xpRecompensa: 800,
    requisito: { tipo: 'casos_resolvidos', meta: 50 },
  });
  await upsertConquista({
    titulo: 'Centurião',
    descricao: 'Resolva 100 casos clínicos.',
    icone: 'Trophy',
    xpRecompensa: 1500,
    requisito: { tipo: 'casos_resolvidos', meta: 100 },
  });
  await upsertConquista({
    titulo: 'Imparável',
    descricao: 'Mantenha uma sequência de 30 dias.',
    icone: 'Zap',
    xpRecompensa: 1000,
    requisito: { tipo: 'sequencia', meta: 30 },
  });
  await upsertConquista({
    titulo: 'Expert',
    descricao: 'Tenha média acima de 90 com ao menos 10 casos.',
    icone: 'Crown',
    xpRecompensa: 1200,
    requisito: { tipo: 'media_geral', meta: 90, minCasos: 10 },
  });
  await upsertConquista({
    titulo: 'Especialista em Ortopedia',
    descricao: 'Resolva 10 casos de ortopedia com média acima de 80.',
    icone: 'Bone',
    xpRecompensa: 600,
    requisito: { tipo: 'casos_area', area: 'ORTOPEDIA', meta: 10, mediaMinima: 80 },
  });
  await upsertConquista({
    titulo: 'Mente Neurológica',
    descricao: 'Resolva 10 casos de neurologia.',
    icone: 'Brain',
    xpRecompensa: 600,
    requisito: { tipo: 'casos_area', area: 'NEUROLOGIA', meta: 10 },
  });
  await upsertConquista({
    titulo: 'Coração Forte',
    descricao: 'Resolva 10 casos cardiorrespiratórios.',
    icone: 'HeartPulse',
    xpRecompensa: 600,
    requisito: { tipo: 'casos_area', area: 'CARDIORRESPIRATORIA', meta: 10 },
  });
  await upsertConquista({
    titulo: 'Primeira Chama',
    descricao: 'Mantenha uma sequência de 3 dias.',
    icone: 'Sparkles',
    xpRecompensa: 150,
    requisito: { tipo: 'sequencia', meta: 3 },
  });
  await upsertConquista({
    titulo: 'Fenômeno',
    descricao: 'Mantenha uma sequência de 90 dias.',
    icone: 'Rocket',
    xpRecompensa: 2500,
    requisito: { tipo: 'sequencia', meta: 90 },
  });
  await upsertConquista({
    titulo: 'Lendário',
    descricao: 'Mantenha uma sequência de 365 dias.',
    icone: 'Gem',
    xpRecompensa: 10000,
    requisito: { tipo: 'sequencia', meta: 365 },
  });

  // ───────────────────────── Missões diárias ─────────────────────────
  async function upsertMissao(data: Prisma.MissaoCreateInput) {
    const existente = await prisma.missao.findFirst({ where: { titulo: data.titulo } });
    if (existente) {
      return prisma.missao.update({ where: { id: existente.id }, data });
    }
    return prisma.missao.create({ data });
  }

  await upsertMissao({
    titulo: 'Aquecimento do dia',
    descricao: 'Resolva 1 caso hoje.',
    tipo: 'resolver_casos',
    meta: 1,
    xpRecompensa: 50,
  });
  await upsertMissao({
    titulo: 'Maratona clínica',
    descricao: 'Resolva 3 casos hoje.',
    tipo: 'resolver_casos',
    meta: 3,
    xpRecompensa: 150,
  });
  await upsertMissao({
    titulo: 'Precisão diagnóstica',
    descricao: 'Acerte acima de 80 em um caso hoje.',
    tipo: 'media_acima',
    meta: 80,
    xpRecompensa: 100,
  });

  // ───────────────────────── Resumo ─────────────────────────
  const [totalUsers, totalCasos, totalConquistas, totalMissoes] = await Promise.all([
    prisma.user.count(),
    prisma.caso.count(),
    prisma.conquista.count(),
    prisma.missao.count(),
  ]);

  // eslint-disable-next-line no-console
  console.log('───────────── Seed FisioCase concluído ─────────────');
  // eslint-disable-next-line no-console
  console.log(`Usuários: ${totalUsers} (admin: ${admin.email}, alunos: ${aluno.email}, ${maria.email})`);
  // eslint-disable-next-line no-console
  console.log(`Casos: ${totalCasos} | Conquistas: ${totalConquistas} | Missões: ${totalMissoes}`);
  // eslint-disable-next-line no-console
  console.log('Senha padrão de todos os usuários: senha123');
  // eslint-disable-next-line no-console
  console.log('─────────────────────────────────────────────────────');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
