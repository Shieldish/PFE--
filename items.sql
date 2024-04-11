-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 11 avr. 2024 à 06:16
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `data`
--

-- --------------------------------------------------------

--
-- Structure de la table `sidebar_items`
--

CREATE TABLE `sidebar_items` (
  `id` int(11) NOT NULL,
  `name_fr` varchar(255) DEFAULT NULL,
  `name_en` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `name_ar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `sidebar_items`
--

INSERT INTO `sidebar_items` (`id`, `name_fr`, `name_en`, `link`, `icon`, `parent_id`, `name_ar`) VALUES
(1, 'Tableau de bord', 'Dashboard', '/#', 'fas fa-tachometer-alt', NULL, 'لوحة القيادة'),
(2, 'Étudiants', 'Students', '/#', 'fas fa-users', NULL, 'طلاب'),
(3, 'Enseignants', 'Instructors', '/#', 'fas fa-chalkboard-teacher', NULL, 'معلمون'),
(4, 'Entreprises', 'Companies', '/#', 'fas fa-building', NULL, 'شركات'),
(5, 'Liste des stages', 'Internship List', '/#', 'fas fa-file-alt', NULL, 'قائمة الدورات التدريبية'),
(6, 'Calendrier', 'Calendar', '/#', 'fas fa-calendar-alt', NULL, 'تقويم'),
(7, 'Paramètres', 'Settings', '/#', 'fas fa-cog', NULL, 'الإعدادات'),
(8, 'Admin', 'Admin', '#', 'fas fa-tasks', NULL, 'المسؤول'),
(9, 'Uploads files', 'Uploads files', '/upload', 'fas fa-upload', 8, 'تحميل الملفات'),
(10, 'Databases', 'Databases', '/gestion', 'fas fa-database', 8, 'قواعد البيانات'),
(11, 'Encadrement', 'Supervision', '/#', 'fas fa-file-alt', NULL, 'الإشراف'),
(12, 'Mon Profiles', 'My Profiles', '/settings', 'fas fa-address-card', 7, 'ملفاتي الشخصية');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `sidebar_items`
--
ALTER TABLE `sidebar_items`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `sidebar_items`
--
ALTER TABLE `sidebar_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
