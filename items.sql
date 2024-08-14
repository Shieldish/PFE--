SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Drop table if it exists
DROP TABLE IF EXISTS sidebar_items;

-- Create table with primary key
CREATE TABLE IF NOT EXISTS `sidebar_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `name_ar` varchar(255) DEFAULT NULL,
  `name_fr` varchar(255) DEFAULT NULL,
  `name_en` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert data
INSERT INTO `sidebar_items` (`id`, `parent_id`, `link`, `icon`, `name_ar`, `name_fr`, `name_en`) VALUES
(1, NULL, '/', 'fas fa-tachometer-alt', 'لوحة القيادة', 'Tableau de bord', 'Dashboard'),
(2, NULL, '/etudiant', 'fas fa-users', 'طلاب', 'Étudiants', 'Students'),
(3, NULL, '/#', 'fas fa-chalkboard-teacher', 'معلمون', 'Enseignants', 'Instructors'),
(4, NULL, '/entreprise', 'fas fa-building', 'شركات', 'Entreprises', 'Companies'),
(5, NULL, '/#', 'fas fa-file-alt', 'قائمة الدورات التدريبية', 'Liste des stages', 'Internship List'),
(6, NULL, '/#', 'fas fa-calendar-alt', 'تقويم', 'Calendrier', 'Calendar'),
(7, NULL, '/#', 'fas fa-cog', 'الإعدادات', 'Paramètres', 'Settings'),
(8, NULL, '#', 'fas fa-tasks', 'المسؤول', 'Admin', 'Admin'),
(9, 8, '/files/upload', 'fas fa-upload', ' تحميل الملفات', ' Uploads files ', ' Uploads files '),
(10, 8, '/gestion', 'fas fa-database', ' قواعد البيانات', ' Databases ', ' Databases '),
(11, NULL, '/#', 'fas fa-file-alt', 'الإشراف', 'Encadrements', 'Supervisions'),
(12, 7, '/settings', 'bi bi-person-lines-fill', ' ملفاتي الشخصية', ' Mon Profiles', ' My Profiles'),
(13, 7, '/settings', 'bi bi-pc-display', ' مشاريعي', ' Mes Projets', ' My Projects'),
(14, 8, '#', 'bi bi-sliders', 'إدارة القائمة', 'gestion menu', 'menu management'),
(15, 11, '/encadrement', 'bi bi-table', 'الإشراف', 'Encadrement', 'Supervision'),
(16, 11, '/planification', 'bi bi-calendar-month', 'تخطيط', 'Planification', 'Planning');

COMMIT;
