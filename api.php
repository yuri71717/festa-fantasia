<?php
/**
 * API Backend Simples e Confiável para Festa Fantasia ETEC
 * Salva as curtidas e novas fantasias diretamente no arquivo dados.json no servidor.
 * Zero banco de dados externo, 100% compatível com XAMPP / Apache / PHP.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dataFile = __DIR__ . '/dados.json';
$uploadsDir = __DIR__ . '/uploads';

// Fantasias padrão iniciais (com as fotos reais enviadas)
$defaultFantasias = [
    [
        'id' => 'fantasia-1',
        'aluno' => 'Lucas Silva',
        'curso' => 'Desenvolvimento de Sistemas',
        'fantasia' => 'Pennywise / Palhaço Dançarino',
        'foto' => 'assets/fantasia-1.png',
        'votos' => 0,
        'dataCriacao' => date('c')
    ],
    [
        'id' => 'fantasia-2',
        'aluno' => 'Pedro Henrique',
        'curso' => 'Administração',
        'fantasia' => 'Palhaço Clássico',
        'foto' => 'assets/fantasia-2.png',
        'votos' => 0,
        'dataCriacao' => date('c')
    ],
    [
        'id' => 'fantasia-3',
        'aluno' => 'Gabriel Souza',
        'curso' => 'Desenvolvimento de Sistemas',
        'fantasia' => 'Cabeludo Sorridente',
        'foto' => 'assets/fantasia-3.png',
        'votos' => 0,
        'dataCriacao' => date('c')
    ],
    [
        'id' => 'fantasia-4',
        'aluno' => 'Camila Rocha',
        'curso' => 'Farmácia',
        'fantasia' => 'Dora Aventureira',
        'foto' => 'assets/fantasia-4.png',
        'votos' => 0,
        'dataCriacao' => date('c')
    ],
    [
        'id' => 'fantasia-5',
        'aluno' => 'Matheus Costa',
        'curso' => 'Administração',
        'fantasia' => 'Coringa (The Joker)',
        'foto' => 'assets/fantasia-5.png',
        'votos' => 0,
        'dataCriacao' => date('c')
    ],
    [
        'id' => 'fantasia-6',
        'aluno' => 'Larissa Mendes',
        'curso' => 'Farmácia',
        'fantasia' => 'Palhaço Maquiagem Artística',
        'foto' => 'assets/fantasia-6.png',
        'votos' => 0,
        'dataCriacao' => date('c')
    ]
];

// Função auxiliar para carregar dados
function loadData($dataFile, $defaultFantasias) {
    if (!file_exists($dataFile)) {
        file_put_contents($dataFile, json_encode($defaultFantasias, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $defaultFantasias;
    }
    $content = file_get_contents($dataFile);
    $json = json_decode($content, true);
    if (!is_array($json) || count($json) === 0) {
        file_put_contents($dataFile, json_encode($defaultFantasias, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $defaultFantasias;
    }
    return $json;
}

// Função auxiliar para salvar dados com lock
function saveData($dataFile, $data) {
    return file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

$action = $_GET['action'] ?? 'get';

// 1. Obter todas as fantasias com as curtidas reais atualizadas
if ($action === 'get') {
    $data = loadData($dataFile, $defaultFantasias);
    echo json_encode(['success' => true, 'fantasias' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Votar / Curtir uma fantasia (grava no arquivo dados.json para todos os dispositivos verem)
if ($action === 'vote') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;

    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        exit;
    }

    $data = loadData($dataFile, $defaultFantasias);
    $found = false;
    $newVotes = 0;

    foreach ($data as &$item) {
        if ($item['id'] === $id) {
            $item['votos'] = intval($item['votos'] ?? 0) + 1;
            $newVotes = $item['votos'];
            $found = true;
            break;
        }
    }
    unset($item);

    if ($found) {
        saveData($dataFile, $data);
        echo json_encode(['success' => true, 'newVotes' => $newVotes, 'id' => $id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Fantasia não encontrada']);
    }
    exit;
}

// 3. Cadastrar nova fantasia
if ($action === 'add') {
    $input = json_decode(file_get_contents('php://input'), true);

    $aluno = trim($input['aluno'] ?? '');
    $curso = trim($input['curso'] ?? 'Desenvolvimento de Sistemas');
    $fantasia = trim($input['fantasia'] ?? '');
    $fotoData = $input['foto'] ?? '';

    if (empty($aluno) || empty($fantasia) || empty($fotoData)) {
        echo json_encode(['success' => false, 'message' => 'Campos obrigatórios não preenchidos']);
        exit;
    }

    // Se a imagem for Base64, salva como arquivo físico na pasta uploads/
    $fotoUrl = $fotoData;
    if (strpos($fotoData, 'data:image') === 0) {
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0777, true);
        }
        $parts = explode(',', $fotoData);
        $imageBinary = base64_decode($parts[1] ?? '');
        if ($imageBinary) {
            $fileName = 'foto_' . time() . '_' . rand(100, 999) . '.jpg';
            $filePath = $uploadsDir . '/' . $fileName;
            file_put_contents($filePath, $imageBinary);
            $fotoUrl = 'uploads/' . $fileName;
        }
    }

    $data = loadData($dataFile, $defaultFantasias);
    $newItem = [
        'id' => 'fantasia-' . time() . '-' . rand(100, 999),
        'aluno' => $aluno,
        'curso' => $curso,
        'fantasia' => $fantasia,
        'foto' => $fotoUrl,
        'votos' => 0,
        'dataCriacao' => date('c')
    ];

    array_unshift($data, $newItem);
    saveData($dataFile, $data);

    echo json_encode(['success' => true, 'fantasia' => $newItem], JSON_UNESCAPED_UNICODE);
    exit;
}

// Ação desconhecida
echo json_encode(['success' => false, 'message' => 'Ação inválida']);
