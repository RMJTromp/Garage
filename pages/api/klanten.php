<?php

    use RMJTromp\RMJTromp;
    use function RMJTromp\apiRespond;

    $limit = $_GET['limit'] ?? 100;
    $limit = is_numeric($limit) ? $limit : 100;
    $limit = min(100, max(1, $limit));

    $offset = $_GET['offset'] ?? 0;
    $offset = is_numeric($offset) ? $offset : 0;
    $offset = max(0, $offset);

    $stmt = RMJTromp::getConnection()->prepare("SELECT * FROM `klanten`  ORDER BY `id` LIMIT ? OFFSET ?");
    $stmt->bind_param("ii", $limit, $offset);
    if($stmt->execute()) {
        $res = $stmt->get_result();

        $clients = [];
        while($row = $res->fetch_assoc()) {
            array_push($clients, [
                "id" => $row['id'],
                "name" => $row['naam'],
                "address" => $row['adres'],
                "postcode" => $row['postcode'],
                "location" => $row['plaats']
            ]);
        }
        apiRespond([
            "success" => true,
            "response" => $clients
        ]);
    } else {
        apiRespond([
            "success" => false,
            "response" => "Er is een fout opgetreden bij het verkrijgen van klantinformatie."
        ]);
    }
