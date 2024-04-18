-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 17 avr. 2024 à 12:50
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
  `parent_id` int(11) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `name_ar` varchar(255) DEFAULT NULL,
  `name_fr` varchar(255) DEFAULT NULL,
  `name_en` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `sidebar_items`
--

INSERT INTO `sidebar_items` (`id`, `parent_id`, `link`, `icon`, `name_ar`, `name_fr`, `name_en`) VALUES
(1, NULL, '/#', 'fas fa-tachometer-alt', 'لوحة القيادة', 'Tableau de bord', 'Dashboard'),
(2, NULL, '/#', 'fas fa-users', 'طلاب', 'Étudiants', 'Students'),
(3, NULL, '/#', 'fas fa-chalkboard-teacher', 'معلمون', 'Enseignants', 'Instructors'),
(4, NULL, '/#', 'fas fa-building', 'شركات', 'Entreprises', 'Companies'),
(5, NULL, '/#', 'fas fa-file-alt', 'قائمة الدورات التدريبية', 'Liste des stages', 'Internship List'),
(6, NULL, '/#', 'fas fa-calendar-alt', 'تقويم', 'Calendrier', 'Calendar'),
(7, NULL, '/#', 'fas fa-cog', 'الإعدادات', 'Paramètres', 'Settings'),
(8, NULL, '#', 'fas fa-tasks', 'المسؤول', 'Admin', 'Admin'),
(9, 8, '/upload', 'fas fa-upload', 'تحميل الملفات', 'Uploads files', 'Uploads files'),
(10, 8, '/gestion', 'fas fa-database', 'قواعد البيانات', 'Databases', 'Databases'),
(11, NULL, '/#', 'fas fa-file-alt', 'الإشراف', 'Encadrement', 'Supervision'),
(12, 7, '/settings', 'fas fa-address-card', 'ملفاتي الشخصية', 'Mon Profiles', 'My Profiles');

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
