<?php
/**
 * Created by PhpStorm.
 * User: Dylan
 * Date: 03/01/2015
 * Time: 13:41
 */

include_once 'BDD_connect.php';

if($_POST['text'] != NULL)
{
    $email = ($_POST['email'] != NULL) ? $_POST['email'] : 'none';

    $req = $bdd->prepare('INSERT INTO feedback (usernameId, email, text, support) VALUES (:usernameId, :email, :text, :support)');

    if($req->execute(array('usernameId' => $_SESSION['userId'], 'email' => $email, 'text' => $_POST['text'], 'support' => $_POST['support'])))
    {
        if($email != 'none')
        {
            $req = $bdd->prepare('UPDATE users SET email = ? WHERE id = ?');
            $req->execute(array($email, $_SESSION['userId']));
        }

        echo 'true';
    }
    else
    {
        echo 'false';
    }
}
else
{
    echo 'false';
}