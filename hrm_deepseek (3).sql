-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 12, 2025 at 11:50 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hrm_deepseek`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

CREATE TABLE `attendances` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `total_hours` int(11) DEFAULT NULL,
  `status` enum('present','absent','late','half_day','holiday','checked') NOT NULL DEFAULT 'present',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendances`
--

INSERT INTO `attendances` (`id`, `employee_id`, `date`, `check_in`, `check_out`, `total_hours`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 6, '2025-11-10', '16:10:35', '16:10:40', 0, 'present', NULL, '2025-11-10 10:10:35', '2025-11-10 10:10:40'),
(2, 1, '2025-11-10', '16:10:48', '16:11:00', 0, 'present', NULL, '2025-11-10 10:10:48', '2025-11-10 10:11:00'),
(3, 10, '2025-11-10', '17:41:33', '17:41:36', 0, 'present', NULL, '2025-11-10 11:41:33', '2025-11-10 11:41:36'),
(5, 8, '2025-11-11', '06:22:32', '06:22:36', 0, 'present', NULL, '2025-11-11 00:22:32', '2025-11-11 00:22:36'),
(6, 7, '2025-11-11', '05:22:48', '23:06:53', 18, 'present', NULL, '2025-11-11 00:22:48', '2025-11-11 17:06:53'),
(7, 2, '2025-11-11', '06:24:11', '22:24:45', NULL, 'present', NULL, '2025-11-11 00:24:11', '2025-11-11 16:24:45'),
(8, 3, '2025-11-11', '06:24:15', '22:25:07', NULL, 'present', NULL, '2025-11-11 00:24:15', '2025-11-11 16:25:07'),
(9, 9, '2025-11-11', '08:09:50', '08:15:32', 0, 'present', NULL, '2025-11-11 02:09:50', '2025-11-11 02:15:32'),
(10, 10, '2025-11-11', '14:21:35', '22:18:02', 8, 'present', NULL, '2025-11-11 08:21:35', '2025-11-11 16:18:02'),
(11, 4, '2025-11-11', '22:24:43', '23:06:06', 1, 'present', NULL, '2025-11-11 16:24:43', '2025-11-11 17:06:06'),
(12, 1, '2025-11-11', '22:57:26', '23:26:59', 0, 'present', NULL, '2025-11-11 16:27:26', '2025-11-11 17:26:59'),
(13, 5, '2025-11-11', '21:39:50', '23:06:58', 1, 'present', NULL, '2025-11-11 16:39:50', '2025-11-11 17:06:58'),
(14, 6, '2025-11-11', '22:41:10', '22:41:17', 0, 'present', NULL, '2025-11-11 16:41:10', '2025-11-11 16:41:17');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `manager_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `description`, `manager_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'IT', 'Web and Technology Management', 4, 1, '2025-11-10 10:14:33', '2025-11-12 08:10:27'),
(2, 'Human Resources', 'Human Resources Management, Recruitment, and Employee Relations', 3, 1, '2025-11-12 08:00:52', '2025-11-12 08:10:27'),
(3, 'Finance', 'Financial Management, Accounting, and Payroll Processing', NULL, 1, '2025-11-12 08:00:52', '2025-11-12 08:00:52'),
(4, 'Sales & Marketing', 'Sales Operations, Marketing, and Business Development', NULL, 1, '2025-11-12 08:00:52', '2025-11-12 08:00:52'),
(5, 'Operations', 'Business Operations and Process Management', NULL, 1, '2025-11-12 08:00:52', '2025-11-12 08:00:52'),
(6, 'Customer Support', 'Customer Service and Technical Support', NULL, 1, '2025-11-12 08:00:52', '2025-11-12 08:00:52'),
(7, 'Research & Development', 'Product Research and Development', NULL, 1, '2025-11-12 08:00:52', '2025-11-12 08:00:52'),
(8, 'Quality Assurance', 'Quality Control and Testing', NULL, 1, '2025-11-12 08:00:52', '2025-11-12 08:00:52'),
(9, 'Administration', 'General Administration and Office Management', NULL, 1, '2025-11-12 08:00:52', '2025-11-12 08:00:52'),
(10, 'Finance', 'Financial Management, Accounting, and Payroll Processing', NULL, 1, '2025-11-12 08:10:27', '2025-11-12 08:10:27'),
(11, 'Sales & Marketing', 'Sales Operations, Marketing, and Business Development', NULL, 1, '2025-11-12 08:10:27', '2025-11-12 08:10:27'),
(12, 'Operations', 'Business Operations and Process Management', 5, 1, '2025-11-12 08:10:27', '2025-11-12 08:10:27'),
(13, 'Customer Support', 'Customer Service and Technical Support', NULL, 1, '2025-11-12 08:10:27', '2025-11-12 08:10:27'),
(14, 'Research & Development', 'Product Research and Development', NULL, 1, '2025-11-12 08:10:27', '2025-11-12 08:10:27'),
(15, 'Quality Assurance', 'Quality Control and Testing', NULL, 1, '2025-11-12 08:10:27', '2025-11-12 08:10:27'),
(16, 'Administration', 'General Administration and Office Management', NULL, 1, '2025-11-12 08:10:27', '2025-11-12 08:10:27');

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_size` varchar(255) NOT NULL,
  `mime_type` varchar(255) NOT NULL,
  `document_type` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `position_id` bigint(20) UNSIGNED DEFAULT NULL,
  `salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `employment_type` varchar(255) NOT NULL DEFAULT 'full-time',
  `joining_date` date NOT NULL,
  `exit_date` date DEFAULT NULL,
  `emergency_contact` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`emergency_contact`)),
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `user_id`, `department_id`, `position_id`, `salary`, `employment_type`, `joining_date`, `exit_date`, `emergency_contact`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 11, 40000.00, 'full-time', '2025-11-09', NULL, NULL, NULL, '2025-11-10 00:31:28', '2025-11-12 08:44:35'),
(2, 2, 16, NULL, 100000.00, 'full-time', '2025-11-09', NULL, NULL, NULL, '2025-11-10 02:19:06', '2025-11-12 08:42:13'),
(3, 3, 2, 8, 80000.00, 'full-time', '2025-11-10', NULL, NULL, NULL, '2025-11-10 02:19:06', '2025-11-12 08:10:15'),
(4, 4, 1, 2, 70000.00, 'full-time', '2025-11-10', NULL, NULL, NULL, '2025-11-10 02:19:06', '2025-11-12 08:10:15'),
(5, 5, 5, 18, 50000.00, 'full-time', '2025-11-10', NULL, NULL, NULL, '2025-11-10 02:19:06', '2025-11-12 08:10:15'),
(6, 6, 1, 3, 56792.00, 'full-time', '2025-11-08', NULL, NULL, NULL, '2025-11-10 02:19:07', '2025-11-12 08:10:15'),
(7, 7, 4, 17, 58771.00, 'full-time', '2025-11-09', NULL, NULL, NULL, '2025-11-10 02:19:07', '2025-11-12 08:10:15'),
(8, 8, 6, 23, 38620.00, 'full-time', '2025-11-10', NULL, NULL, NULL, '2025-11-10 02:19:07', '2025-11-12 08:10:15'),
(9, 9, 7, 26, 52953.00, 'full-time', '2025-11-10', NULL, NULL, NULL, '2025-11-10 02:19:07', '2025-11-12 08:10:15'),
(10, 10, 1, 9, 40000.00, 'full-time', '2025-10-26', NULL, NULL, NULL, '2025-11-10 10:59:37', '2025-11-12 08:47:18');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`) VALUES
(1, 'default', '{\"uuid\":\"39d351de-63d9-48ae-909c-03c70b28bf8c\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"e93f2b66-b2b9-488c-a9f6-bbcede42f1d8\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:4:\\\"mail\\\";}}\"},\"createdAt\":1762794299,\"delay\":null}', 0, NULL, 1762794299, 1762794299),
(2, 'default', '{\"uuid\":\"e9a6c5c8-c9da-4db9-8b73-793a2364da18\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"e93f2b66-b2b9-488c-a9f6-bbcede42f1d8\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\"},\"createdAt\":1762794299,\"delay\":null}', 0, NULL, 1762794299, 1762794299),
(3, 'default', '{\"uuid\":\"26522c12-c923-4578-b35e-ceb82d129daf\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:2;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"08132a3b-a302-45d1-9369-62ca9e105659\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:4:\\\"mail\\\";}}\"},\"createdAt\":1762794350,\"delay\":null}', 0, NULL, 1762794350, 1762794350),
(4, 'default', '{\"uuid\":\"e094e971-2e3f-4fb6-9785-5ecec5fae35b\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:2;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"08132a3b-a302-45d1-9369-62ca9e105659\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\"},\"createdAt\":1762794350,\"delay\":null}', 0, NULL, 1762794350, 1762794350),
(5, 'default', '{\"uuid\":\"a0ce1205-c8ce-4582-940a-34821df14302\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:2;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"c3f38234-97b3-4f96-b8a3-2beb4bf66c55\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:4:\\\"mail\\\";}}\"},\"createdAt\":1762794899,\"delay\":null}', 0, NULL, 1762794899, 1762794899),
(6, 'default', '{\"uuid\":\"cdf94efd-3692-434f-803f-2f3edceeb6a1\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:2;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"c3f38234-97b3-4f96-b8a3-2beb4bf66c55\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\"},\"createdAt\":1762794899,\"delay\":null}', 0, NULL, 1762794899, 1762794899),
(7, 'default', '{\"uuid\":\"48fa9379-0e0c-40fe-acfb-18906318cbb9\",\"displayName\":\"App\\\\Events\\\\LeaveStatusUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":16:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\LeaveStatusUpdated\\\":1:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:2;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\"},\"createdAt\":1762794899,\"delay\":null}', 0, NULL, 1762794899, 1762794899),
(8, 'default', '{\"uuid\":\"450a0612-d525-4b81-ad23-8a7370c3df47\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"ef136296-fb97-444d-848f-83c8aedb5a22\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:4:\\\"mail\\\";}}\"},\"createdAt\":1762795418,\"delay\":null}', 0, NULL, 1762795418, 1762795418),
(9, 'default', '{\"uuid\":\"cd80eb9e-a970-4fa5-b4af-d8d3f3fa8ffe\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"ef136296-fb97-444d-848f-83c8aedb5a22\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\"},\"createdAt\":1762795418,\"delay\":null}', 0, NULL, 1762795418, 1762795418),
(10, 'default', '{\"uuid\":\"7cf78c57-c8df-4b2d-b971-a599f1056be2\",\"displayName\":\"App\\\\Events\\\\LeaveStatusUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":16:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\LeaveStatusUpdated\\\":1:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\"},\"createdAt\":1762795418,\"delay\":null}', 0, NULL, 1762795418, 1762795418),
(11, 'default', '{\"uuid\":\"0d20a69c-88a0-4a5d-8651-b8e85e1f74e7\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"4ade1ac1-6db4-4542-afde-eabc78ef36c1\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:4:\\\"mail\\\";}}\"},\"createdAt\":1762795604,\"delay\":null}', 0, NULL, 1762795604, 1762795604),
(12, 'default', '{\"uuid\":\"63587b45-f75f-45f1-bcb7-fbb86685d42a\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"4ade1ac1-6db4-4542-afde-eabc78ef36c1\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\"},\"createdAt\":1762795604,\"delay\":null}', 0, NULL, 1762795604, 1762795604),
(13, 'default', '{\"uuid\":\"cc7c4124-3524-4fd5-826b-84fd78fa5fe1\",\"displayName\":\"App\\\\Events\\\\LeaveStatusUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":16:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\LeaveStatusUpdated\\\":1:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\"},\"createdAt\":1762795604,\"delay\":null}', 0, NULL, 1762795604, 1762795604),
(14, 'default', '{\"uuid\":\"9a9e113d-0849-4aa4-b692-f5fac7f9d37a\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"af93ab0d-2ce8-4b21-9e6a-35b8881f2d08\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:4:\\\"mail\\\";}}\"},\"createdAt\":1762796283,\"delay\":null}', 0, NULL, 1762796283, 1762796283),
(15, 'default', '{\"uuid\":\"5c8122fc-2f97-4187-ae32-15d990e5ad48\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:1;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"af93ab0d-2ce8-4b21-9e6a-35b8881f2d08\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\"},\"createdAt\":1762796283,\"delay\":null}', 0, NULL, 1762796283, 1762796283),
(16, 'default', '{\"uuid\":\"2ff4ae5a-846d-43f1-8cb3-a6779a1f7102\",\"displayName\":\"App\\\\Events\\\\LeaveStatusUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":16:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\LeaveStatusUpdated\\\":1:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\"},\"createdAt\":1762796283,\"delay\":null}', 0, NULL, 1762796283, 1762796283),
(17, 'default', '{\"uuid\":\"430a6470-5766-4227-9445-834a5c779ff4\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:9;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:5;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"cd9d7372-0004-4b98-ae18-d3c7746ea824\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:4:\\\"mail\\\";}}\"},\"createdAt\":1762800236,\"delay\":null}', 0, NULL, 1762800236, 1762800236),
(18, 'default', '{\"uuid\":\"58f1fb6c-edd8-48c9-b7f5-60b36c6d3194\",\"displayName\":\"App\\\\Notifications\\\\LeaveStatusNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:9;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\LeaveStatusNotification\\\":2:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:5;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"cd9d7372-0004-4b98-ae18-d3c7746ea824\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\"},\"createdAt\":1762800236,\"delay\":null}', 0, NULL, 1762800236, 1762800236),
(19, 'default', '{\"uuid\":\"98627f0e-74ec-4754-b9fe-2f7d4270c346\",\"displayName\":\"App\\\\Events\\\\LeaveStatusUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":16:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\LeaveStatusUpdated\\\":1:{s:5:\\\"leave\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Leave\\\";s:2:\\\"id\\\";i:5;s:9:\\\"relations\\\";a:2:{i:0;s:8:\\\"employee\\\";i:1;s:13:\\\"employee.user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\"},\"createdAt\":1762800236,\"delay\":null}', 0, NULL, 1762800236, 1762800236);

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leaves`
--

CREATE TABLE `leaves` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `leave_type` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int(11) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leaves`
--

INSERT INTO `leaves` (`id`, `employee_id`, `leave_type`, `start_date`, `end_date`, `total_days`, `reason`, `status`, `approved_by`, `admin_notes`, `created_at`, `updated_at`) VALUES
(1, 1, 'sick', '2025-11-11', '2025-11-12', 2, 'sick', 'pending', 2, NULL, '2025-11-10 10:11:45', '2025-11-10 11:04:56'),
(2, 1, 'casual', '2025-11-19', '2025-11-25', 7, 'no', 'approved', 2, NULL, '2025-11-10 11:05:42', '2025-11-10 11:14:59'),
(3, 1, 'maternity', '2025-11-28', '2025-11-30', 3, 'ok', 'approved', 2, NULL, '2025-11-10 11:15:29', '2025-11-10 11:38:03'),
(4, 9, 'paternity', '2025-11-13', '2025-11-14', 2, 'kk', 'pending', NULL, NULL, '2025-11-10 11:52:37', '2025-11-10 11:52:37'),
(5, 9, 'sick', '2025-11-11', '2025-11-12', 2, 'n', 'approved', 2, NULL, '2025-11-10 11:56:09', '2025-11-10 12:43:56');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2025_11_10_043106_create_personal_access_tokens_table', 1),
(5, '2025_11_10_043817_create_departments_table', 2),
(6, '2025_11_10_043817_create_roles_table', 2),
(7, '2025_11_10_043819_create_leaves_table', 3),
(8, '2025_11_10_043825_create_payrolls_table', 3),
(9, '2025_11_10_043926_add_role_id_to_users_table', 3),
(10, '2025_11_10_044354_create_positions_table', 3),
(11, '2025_11_10_064202_create_documents_table', 4);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payrolls`
--

CREATE TABLE `payrolls` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `pay_period` varchar(255) NOT NULL,
  `pay_date` date NOT NULL,
  `basic_salary` decimal(10,2) NOT NULL,
  `house_allowance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `transport_allowance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `bonus` decimal(10,2) NOT NULL DEFAULT 0.00,
  `overtime_pay` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_deduction` decimal(10,2) NOT NULL DEFAULT 0.00,
  `other_deductions` decimal(10,2) NOT NULL DEFAULT 0.00,
  `net_salary` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('draft','processed','paid') NOT NULL DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payrolls`
--

INSERT INTO `payrolls` (`id`, `employee_id`, `pay_period`, `pay_date`, `basic_salary`, `house_allowance`, `transport_allowance`, `bonus`, `overtime_pay`, `tax_deduction`, `other_deductions`, `net_salary`, `notes`, `status`, `created_at`, `updated_at`) VALUES
(1, 10, 'monthly', '2025-11-10', 20000.00, 10000.00, 5000.00, 15000.00, 0.00, 0.00, 0.00, 50000.00, NULL, 'processed', '2025-11-10 11:04:23', '2025-11-10 11:04:23'),
(2, 1, 'monthly', '2025-11-10', 20000.00, 5000.00, 5000.00, 10000.00, 0.00, 0.00, 0.00, 40000.00, NULL, 'processed', '2025-11-10 11:44:15', '2025-11-10 11:44:15');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(3, 'App\\Models\\User', 2, 'auth_token', 'e3af935e6229fc10632056821a30b783a46f1df47b10c1bde71c0ec19e3f2346', '[\"*\"]', '2025-11-10 09:24:02', NULL, '2025-11-10 02:20:57', '2025-11-10 09:24:02'),
(5, 'App\\Models\\User', 2, 'auth_token', 'c2d157a5700f24d7c6395f62ef7c36429455ea015cf1a52bcde41a562dd63046', '[\"*\"]', '2025-11-10 12:44:25', NULL, '2025-11-10 10:09:29', '2025-11-10 12:44:25'),
(7, 'App\\Models\\User', 9, 'auth_token', 'e8b98b6ff2f1777992a824550d3311691b833065466b5469ffbcbf5a1a58396d', '[\"*\"]', '2025-11-12 08:53:17', NULL, '2025-11-10 11:51:14', '2025-11-12 08:53:17'),
(8, 'App\\Models\\User', 2, 'auth_token', '1b33d86d361826e33a86b418cdb6a174fd69bec5dfd28dcf105b8bc7aeb8061e', '[\"*\"]', '2025-11-11 08:30:45', NULL, '2025-11-10 23:44:15', '2025-11-11 08:30:45'),
(10, 'App\\Models\\User', 2, 'auth_token', 'b991406828dd12fee3b0cf62554f4ce806a38ccf77db5ee8c4ea4589f37446ce', '[\"*\"]', '2025-11-12 05:05:08', NULL, '2025-11-11 16:11:20', '2025-11-12 05:05:08'),
(12, 'App\\Models\\User', 2, 'auth_token', '0cc8de02d17b2b93060af2cf1ba10b6833f81c25f69424fffbf3eee43aab8b3d', '[\"*\"]', '2025-11-12 09:03:28', NULL, '2025-11-12 05:50:29', '2025-11-12 09:03:28');

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE `positions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `description` text DEFAULT NULL,
  `min_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `positions`
--

INSERT INTO `positions` (`id`, `title`, `department_id`, `description`, `min_salary`, `max_salary`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Software Engineer', 1, 'Develop and maintain software applications', 50000.00, 100000.00, 1, '2025-11-11 18:00:19', '2025-11-11 18:00:19'),
(2, 'Senior Developer', 1, 'Lead development projects and mentor junior developers', 80000.00, 130000.00, 1, '2025-11-11 18:00:19', '2025-11-11 18:00:19'),
(3, 'Project Manager', 1, 'Manage IT projects and teams', 70000.00, 120000.00, 1, '2025-11-11 18:00:19', '2025-11-11 18:00:19'),
(5, 'Quality Assurance', 1, 'Test software applications for quality', 40000.00, 75000.00, 1, '2025-11-11 18:00:19', '2025-11-11 18:00:19'),
(6, 'Chief Technology Officer (CTO)', 1, 'Technology leadership and strategy', 150000.00, 300000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(7, 'IT Manager', 1, 'IT department management', 80000.00, 150000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(8, 'Senior Software Engineer', 1, 'Senior level software development', 60000.00, 120000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(9, 'Junior Developer', 1, 'Software development and maintenance', 40000.00, 80000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(11, 'IT Support Specialist', 1, 'Technical support and troubleshooting', 25000.00, 50000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(12, 'HR Director', 2, 'Human resources leadership', 90000.00, 180000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(13, 'HR Manager', 2, 'HR department management', 60000.00, 120000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(14, 'Recruitment Specialist', 2, 'Talent acquisition and recruitment', 35000.00, 70000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(15, 'HR Generalist', 2, 'General HR operations', 30000.00, 60000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(16, 'Chief Financial Officer (CFO)', 3, 'Financial leadership and strategy', 120000.00, 250000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(17, 'Finance Manager', 3, 'Finance department management', 70000.00, 140000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(18, 'Senior Accountant', 3, 'Financial accounting and reporting', 45000.00, 90000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(19, 'Accountant', 3, 'Accounting operations', 30000.00, 60000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(20, 'Sales Director', 4, 'Sales leadership and strategy', 100000.00, 200000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(21, 'Marketing Manager', 4, 'Marketing department management', 65000.00, 130000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(22, 'Sales Executive', 4, 'Sales and business development', 35000.00, 80000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(23, 'Marketing Specialist', 4, 'Marketing campaigns and analytics', 32000.00, 65000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(24, 'Operations Manager', 5, 'Business operations management', 55000.00, 110000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(25, 'Operations Coordinator', 5, 'Operations coordination', 28000.00, 55000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(26, 'Customer Support Manager', 6, 'Customer support team management', 40000.00, 80000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(27, 'Senior Support Specialist', 6, 'Advanced customer support', 30000.00, 60000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(28, 'Customer Support Representative', 6, 'Customer service and support', 20000.00, 40000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(29, 'R&D Manager', 7, 'Research and development leadership', 75000.00, 150000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(30, 'Research Scientist', 7, 'Scientific research and development', 50000.00, 100000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(31, 'Product Developer', 7, 'Product development and innovation', 40000.00, 85000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(32, 'QA Manager', 8, 'Quality assurance management', 50000.00, 100000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(33, 'Senior QA Engineer', 8, 'Advanced quality testing', 38000.00, 75000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(34, 'QA Tester', 8, 'Quality testing and assurance', 25000.00, 50000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(35, 'Office Administrator', 9, 'Office administration and management', 28000.00, 55000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03'),
(36, 'Administrative Assistant', 9, 'General administrative support', 20000.00, 40000.00, 1, '2025-11-12 08:10:03', '2025-11-12 08:10:03');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `permissions` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `slug`, `permissions`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Administrator', 'admin', '\"[\\\"*\\\"]\"', 1, '2025-11-09 23:01:52', '2025-11-09 23:01:52'),
(2, 'HR Manager', 'hr', '\"[\\\"employee.view\\\",\\\"employee.create\\\",\\\"employee.edit\\\",\\\"employee.delete\\\",\\\"attendance.view\\\",\\\"attendance.create\\\",\\\"attendance.edit\\\",\\\"leave.view\\\",\\\"leave.approve\\\",\\\"leave.reject\\\",\\\"payroll.view\\\",\\\"payroll.create\\\",\\\"payroll.edit\\\",\\\"department.view\\\",\\\"department.create\\\",\\\"department.edit\\\"]\"', 1, '2025-11-09 23:01:52', '2025-11-09 23:01:52'),
(3, 'Department Manager', 'manager', '\"[\\\"employee.view\\\",\\\"attendance.view\\\",\\\"leave.view\\\",\\\"leave.approve\\\",\\\"payroll.view\\\",\\\"department.view\\\"]\"', 1, '2025-11-09 23:01:52', '2025-11-09 23:01:52'),
(4, 'Employee', 'employee', '\"[\\\"attendance.view\\\",\\\"attendance.create\\\",\\\"leave.view\\\",\\\"leave.create\\\",\\\"payroll.view\\\"]\"', 1, '2025-11-09 23:01:52', '2025-11-09 23:01:52');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('2wThyImaRzToGoPmcizchShSEWKzq8qM4UBz8Ox3', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUXI5S1FEMXZjNWdtSkRYcFBJdFdKa3ZxRGNUdzFSQU5pQlVFcXhqWCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1762755694);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `role_id` bigint(20) UNSIGNED DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `employee_id` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `role_id`, `phone`, `address`, `date_of_birth`, `hire_date`, `employee_id`, `is_active`) VALUES
(1, 'Tonmoy Mirza', 'moynulislamshimanto24@gmail.com', NULL, '$2y$12$q2WsJXkJDpQ/UG5YUa/2nOyrwrNDVNRbqQxc0qb5sDbtftSut71Mq', NULL, '2025-11-10 00:31:28', '2025-11-10 00:31:28', 4, '01949854504', NULL, NULL, '2025-11-10', '23456', 1),
(2, 'System Administrator', 'admin@gmail.com', NULL, '$2y$12$sLphfUXbIDFm8e2u6YDWpOGbWL7nMEF8J6X4m4FuYer8NcOBDHv0C', NULL, '2025-11-10 02:19:06', '2025-11-12 05:50:18', 1, '+8801XXXXXXXX11', NULL, NULL, '2025-11-10', 'ADM001', 1),
(3, 'HR Manager', 'hr@gmail.com', NULL, '$2y$12$xmG4jsdtl8uwq2Zljs50W.kSWihIlM19.ao3KK3lVPYQAsa2zj/s.', NULL, '2025-11-10 02:19:06', '2025-11-10 02:19:06', 2, '+8801XXXXXXXXX', NULL, NULL, '2025-11-10', 'HR001', 1),
(4, 'Department Manager', 'manager@gmail.com', NULL, '$2y$12$iuK2WsF/Faej9IV50OhQde4APaZs2kOE0PPNFh6qNVw7LDBY4qBv6', NULL, '2025-11-10 02:19:06', '2025-11-10 02:19:06', 3, '+8801XXXXXXXXX', NULL, NULL, '2025-11-10', 'MGR001', 1),
(5, 'Regular Employee', 'employee@gmail.com', NULL, '$2y$12$J/kT5y.FqxVZhQSvsx0Pqe.couW/g3lDwwcAopaaJqUkfoQh5cjWm', NULL, '2025-11-10 02:19:06', '2025-11-10 02:19:06', 4, '+8801XXXXXXXXX', NULL, NULL, '2025-11-10', 'EMP001', 1),
(6, 'John Doe', 'john@gmail.com', NULL, '$2y$12$7nxxmT.0u5o06WGPVgk5survwmDY7vcD6tURHvUguugbBFnchi.I2', NULL, '2025-11-10 02:19:07', '2025-11-12 06:51:24', 4, '+8801971990883', NULL, NULL, '2025-11-10', 'EMP002', 1),
(7, 'Jane Smith', 'jane@gmail.com', NULL, '$2y$12$ebYADZj3GbiMQ4C3cYyS/uxzxpK0XydxnxJOartxA4TqbL4zxnAcq', NULL, '2025-11-10 02:19:07', '2025-11-10 02:19:07', 4, '+8801437282929', NULL, NULL, '2025-11-10', 'EMP003', 1),
(8, 'Mike Johnson', 'mike@gmail.com', NULL, '$2y$12$u2omvolBbyNspidcQg.ghucYQv7CbEJdC7rPqkgfxkq4NwjtJ5Hi2', NULL, '2025-11-10 02:19:07', '2025-11-10 02:19:07', 4, '+8801532833439', NULL, NULL, '2025-11-10', 'EMP004', 1),
(9, 'Sarah Wilson', 'sarah@gmail.com', NULL, '$2y$12$gvlcVKcGOXDcbLwOsbLldOSu29ybCDiaeTz0sXYDivdlXhr3u0.1C', NULL, '2025-11-10 02:19:07', '2025-11-12 06:01:19', 4, '+8801660844283', NULL, NULL, '2025-11-10', 'EMP005', 1),
(10, 'Ripon Hossain', 'ripon@gmail.com', NULL, '$2y$12$yBoLxRLRWtCfvCqpZDWb7uN0YI8AUXP9oEe2I0FQJBfNVSDGz8keW', NULL, '2025-11-10 10:59:37', '2025-11-12 06:39:50', NULL, '01955215474', NULL, NULL, NULL, 'EM5007', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `departments_manager_id_foreign` (`manager_id`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `documents_employee_id_foreign` (`employee_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employees_user_id_foreign` (`user_id`),
  ADD KEY `employees_department_id_foreign` (`department_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leaves`
--
ALTER TABLE `leaves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leaves_employee_id_foreign` (`employee_id`),
  ADD KEY `leaves_approved_by_foreign` (`approved_by`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payrolls_employee_id_foreign` (`employee_id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `positions_department_id_foreign` (`department_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`),
  ADD UNIQUE KEY `roles_slug_unique` (`slug`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_employee_id_unique` (`employee_id`),
  ADD KEY `users_role_id_foreign` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `leaves`
--
ALTER TABLE `leaves`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `payrolls`
--
ALTER TABLE `payrolls`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `departments_manager_id_foreign` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employees_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leaves`
--
ALTER TABLE `leaves`
  ADD CONSTRAINT `leaves_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leaves_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD CONSTRAINT `payrolls_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `positions`
--
ALTER TABLE `positions`
  ADD CONSTRAINT `positions_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
