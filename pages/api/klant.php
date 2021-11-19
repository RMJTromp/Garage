<?php

    use RMJTromp\core\Client;
    use RMJTromp\exceptions\IllegalArgumentException;
    use RMJTromp\exceptions\IllegalStateException;
    use RMJTromp\exceptions\MySQLException;
    use RMJTromp\RMJTromp;
    use function RMJTromp\apiRespond;

    require_once "RMJTromp/core/Client.php";

    $method = RMJTromp::getRequestMethod();

    if($method === "POST") {
        try {
            $client = Client::createClient($_POST['name'], $_POST['address'], $_POST['postcode'], $_POST['location']);
            apiRespond([
                "success" => true,
                "response" => [
                    "id" => $client->getId(),
                    "name" => $client->getName(),
                    "address" => $client->getAddress(),
                    "postcode" => $client->getPostCode(),
                    "location" => $client->getLocation()
                ]
            ]);
        } catch (IllegalStateException|IllegalArgumentException $e) {
            apiRespond([
                "success" => false,
                "response" => $e->getMessage()
            ]);
        } catch (MySQLException $e) {
            apiRespond([
                "success" => false,
                "response" => "Er is een fout opgetreden bij het maken van wijzigingen in de database"
            ]);
        }
    } else {
        if(is_numeric($_GET['id'] ?? null)) {
            try {
                $client = Client::getClient((int)$_GET['id']);
                if($method === "GET") {
                    apiRespond([
                        "success" => true,
                        "response" => [
                            "id" => $client->getId(),
                            "name" => $client->getName(),
                            "address" => $client->getAddress(),
                            "postcode" => $client->getPostCode(),
                            "location" => $client->getLocation()
                        ]
                    ]);
                } else if($method === "DELETE") {
                    try {
                        $client->delete();
                        apiRespond([
                            "success" => true,
                            "response" => "Klant succesvol verwijderd"
                        ]);
                    } catch (Exception $e) {
                        apiRespond([
                            "success" => false,
                            "response" => "Er is een fout opgetreden bij het verwijderen van deze klant"
                        ]);
                    }
                } else if($method === "PUT") {
                    $_PUT = RMJTromp::getPHPInput();
                    try {
                        if(!empty($_PUT['name'] ?? null)) $client->setName($_PUT['name']);
                        if(!empty($_PUT['address'] ?? null)) $client->setAddress($_PUT['address']);
                        if(!empty($_PUT['postcode'] ?? null)) $client->setPostCode($_PUT['postcode']);
                        if(!empty($_PUT['location'] ?? null)) $client->setLocation($_PUT['location']);

                        apiRespond([
                            "success" => true,
                            "response" => "Client succesvol bewerkt"
                        ]);
                    } catch (Exception $e) {
                        apiRespond([
                            "success" => false,
                            "response" => "Er is een fout opgetreden bij het bewerken van deze klant"
                        ]);
                    }
                }
            } catch (Exception $e) {
                apiRespond([
                    "success" => false,
                    "response" => "Kon geen klant met die ID vinden"
                ]);
            }
        }
    }