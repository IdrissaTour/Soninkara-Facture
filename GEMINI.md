# Documentation Soninkara Facture - Résumé Technique & Directives IA

Ce document résume l'application **Soninkara Facture** (anciennement IZI Facture), ses fonctionnalités, sa structure de fichiers, ses choix de conception (design) et fournit des instructions claires pour les futurs modèles d'IA intervenant sur ce projet.

---

## 1. Description de l'Application

**Soninkara Facture** est une application web moderne de facturation et de gestion de trésorerie (SaaS) conçue spécifiquement pour les freelances, PME et entrepreneurs d'Afrique de l'Ouest (Sénégal, Côte d'Ivoire, Mali, etc.). 

Elle répond aux spécificités locales en proposant :
*   Une facturation nativement configurée en **Franc CFA (FCFA)** avec un formatage respectant les conventions d'écriture locales.
*   Un calcul automatisé de la **TVA à 18%** (taux standard harmonisé dans les zones UEMOA et CEMAC).
*   Des options de téléchargement direct en **PDF** et de gestion d'impression parfaitement optimisées.
*   Une double compatibilité : un mode Démo local (via des données simulées) et un mode Cloud de production (connecté à **Supabase**).

---

## 2. Fonctionnalités Implémentées

### A. Espace Public & Tunnel d'Accès
*   **Landing Page (`app/page.tsx`)** : Page de présentation dynamique, adaptative (mobile/desktop) avec grille de fonctionnalités, étapes d'utilisation, grille tarifaire interactive avec switch de cycle de facturation (mensuel vs annuel avec -20%), et témoignages d'entreprises locales.
*   **Authentification (`app/login/`, `app/signup/`)** : Pages de connexion et d'inscription prêtes à l'emploi avec connexion sécurisée Supabase.
*   **Onboarding (`app/onboarding/page.tsx`)** : Formulaire d'initialisation pour configurer l'identité de l'entreprise (nom, e-mail, téléphone, adresse) et charger son logo (support des formats PNG et JPG convertis en base64).

### B. Tableau de Bord & Statistiques
*   **Dashboard (`app/dashboard/page.tsx`)** : 
    *   Bannière d'accueil personnalisée avec message dynamique.
    *   Indicateurs financiers clés : *Total Facturé*, *Montant Encaissé*, *Montant En Attente*, *Montant En Retard*. Chaque indicateur affiche la tendance et une icône dédiée.
    *   **Graphique d'Activité SVG interactif** : Représente visuellement le flux de trésorerie (Facturé vs Encaissé) à l'aide de courbes, marqueurs et dégradés SVG animés.
    *   Aperçu rapide des **Top Clients** et des **Factures Récentes** avec accès directs.

### C. Gestion des Factures (Invoices)
*   **Liste des Factures (`app/dashboard/invoices/page.tsx`)** : Filtre en temps réel par recherche de texte et par statut (*Brouillon*, *Envoyée*, *Payée*, *En retard*). Tri dynamique par date d'émission ou montant total.
*   **Détail d'une Facture (`app/dashboard/invoices/[id]/page.tsx`)** :
    *   Aperçu premium structuré façon "Feuille de Papier".
    *   Mise à jour rapide du statut de paiement via un sélecteur d'action.
    *   Moteur d'impression avec masquage automatique des contrôles administratifs (`no-print`) et suppression des ombres/marges pour un rendu PDF propre.
*   **Création / Édition (`app/dashboard/invoices/new/`, `app/dashboard/invoices/[id]/edit/`)** : 
    *   Sélection du client et choix des dates d'émission et d'échéance.
    *   Gestion dynamique des lignes de facturation (ajout/suppression de lignes à la volée, calcul du total de chaque ligne en temps réel).
    *   Calcul en direct du Sous-total HT, de la TVA (18%) et du Total TTC dans un volet latéral fixe.
    *   Zone de saisie des mentions spécifiques ou coordonnées bancaires.

### D. Registre des Clients
*   **Gestion de Clients (`app/dashboard/clients/page.tsx`)** : Liste des clients avec barre de recherche. Formulaire modal permettant de créer, modifier ou supprimer un profil client (nom, email, téléphone, adresse). Lien direct vers l'historique des factures associées.

### E. Configuration & Paramètres
*   **Paramètres (`app/dashboard/settings/page.tsx`)** : Édition des informations de l'entreprise (nom, e-mail, téléphone, adresse) et téléversement du logo d'en-tête.

---

## 3. Structure des Fichiers

La structure globale du projet suit la convention Next.js (App Router) et s'articule comme suit :

```
IZI Facture/ (Racine)
├── app/                              # Routes et pages Next.js
│   ├── dashboard/                    # Pages de l'espace membre
│   │   ├── clients/                  # Gestion des clients
│   │   │   └── page.tsx
│   │   ├── invoices/                 # Gestion des factures
│   │   │   ├── [id]/
│   │   │   │   ├── edit/
│   │   │   │   │   └── page.tsx      # Formulaire d'édition de facture
│   │   │   │   └── page.tsx          # Détail & Impression de facture
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Formulaire de création de facture
│   │   │   └── page.tsx              # Liste des factures
│   │   ├── settings/                 # Paramètres de l'entreprise
│   │   │   └── page.tsx
│   │   ├── layout.tsx                # Structure de navigation globale
│   │   └── page.tsx                  # Accueil du Dashboard (graphiques, indicateurs)
│   ├── fonts/                        # Polices locales (Outfit, Geist)
│   ├── login/                        # Page de connexion
│   │   └── page.tsx
│   ├── signup/                       # Page d'inscription
│   │   └── page.tsx
│   ├── onboarding/                   # Première configuration entreprise
│   │   └── page.tsx
│   ├── globals.css                   # Styles CSS globaux & règles d'impression
│   ├── layout.tsx                    # Layout racine HTML/Body
│   └── page.tsx                      # Page d'atterrissage (Landing)
├── components/                       # Composants UI réutilisables
│   └── layout/
│       ├── MobileNav.tsx             # Menu de navigation mobile glissant
│       ├── Sidebar.tsx               # Barre latérale gauche (Desktop)
│       └── TopBar.tsx                # Barre d'en-tête supérieure
├── lib/                              # Fonctions utilitaires et logique métier
│   ├── actions/
│   │   └── db.ts                     # Actions serveur de base de données (Mock + Supabase)
│   ├── supabase/
│   │   ├── client.ts                 # Client Supabase pour composant client (CSR)
│   │   └── server.ts                 # Client Supabase pour composants serveurs (SSR)
│   ├── mock-data.ts                  # Données de simulation pour le mode Démo
│   ├── types.ts                      # Types TypeScript partagés (Invoice, Client, etc.)
│   └── utils/
│       └── invoice.ts                # Formateurs (FCFA, Dates) et calculs financiers
├── supabase/                         # Configuration SQL Supabase
│   └── migrations/
│       └── 20260522_init.sql         # Migration SQL initiale (Tables, RLS, Triggers)
├── middleware.ts                     # Middleware de sécurité et redirection des sessions
├── next.config.mjs                   # Configuration Next.js
├── tailwind.config.ts                # Jetons de design (Color System, Shadows, Fonts)
├── tsconfig.json                     # Configuration TypeScript
└── package.json                      # Dépendances et scripts de build
```

---

## 4. Technologies Utilisées

*   **Framework Principal** : Next.js 14.2 (App Router)
*   **Langage** : TypeScript 5.x
*   **Librairie UI** : React 18.x
*   **Stylisation** : Tailwind CSS 3.4 (avec prise en charge de variables personnalisées CSS)
*   **Base de Données & Authentification** : Supabase Database, Auth & SSR client
*   **Bibliothèque d'icônes** : Lucide React
*   **Formulaires & Validation** : Zod & React Hook Form (avec intégrations resolver)

---

## 5. Décisions de Design (Design System)

L'interface de l'application a été conçue pour offrir un aspect premium, fluide et hautement professionnel.

*   **Palette de couleurs** :
    *   *Brand* : Un bleu indigo profond (`#4f46e5` à `#1e1b4b`) utilisé pour les boutons principaux, les états actifs, et les éléments clés de la marque.
    *   *Sidebar* : Arrière-plan sombre de haute qualité en ardoise foncée (`bg-slate-950`).
    *   *Feedback Statuts* : Vert émeraude pour les paiements validés (`paid`), Bleu pour les factures émises en attente (`sent`), Gris ardoise pour les brouillons (`draft`), et Rose/Rouge pour les factures en retard (`overdue`).
*   **Typographie** : Utilisation exclusive de la police **Outfit** (`font-sans`) pour donner un ton moderne et épuré.
*   **Cartes (Cards System)** : Toutes les sections d'information sont encapsulées dans des conteneurs blancs aux coins très arrondis (`rounded-2xl`), avec des bordures subtiles (`border-slate-200/80`) et une ombre portée douce (`shadow-premium`), réagissant au survol (`card-hover-effect`).
*   **Graphiques SVG sur mesure** : Pour éviter d'alourdir l'application avec des bibliothèques de graphiques volumineuses (comme Recharts ou Chart.js), le dashboard intègre un graphique SVG dessiné à la main avec des effets de courbe lissée et des dégradés décolorés en arrière-plan.
*   **Optimisation de l'Impression** : Un ensemble complet de règles CSS `@media print` dans `globals.css` réorganise la facture pour l'adapter à une feuille A4 lors de l'aperçu avant impression ou de l'export PDF. Les éléments interactifs (boutons, sélecteurs) sont masqués via la classe `.no-print`.

---

## 6. Instructions pour un Futur Modèle d'IA

Si vous êtes un modèle d'IA et que vous devez modifier, déboguer ou enrichir cette application, vous devez **impérativement** respecter les règles de développement et de style suivantes :

### Règle de politesse globale (MANDATOIRE)
*   Vous devez commencer **toutes** vos réponses par la salutation suivante : **"SALAM IDRISSA "** (en majuscules, suivie d'un espace exact).

### Directives d'écriture de Code
1.  **Formatage de Devises** : N'affichez jamais de montants financiers bruts sans formatage. Utilisez systématiquement la fonction utilitaire [formatFCFA](file:///lib/utils/invoice.ts#L6-L12) importée de `@/lib/utils/invoice`.
2.  **Formatage de Dates** : Utilisez toujours la fonction [formatDateFrench](file:///lib/utils/invoice.ts#L46-L56) pour convertir les dates SQL en chaînes compréhensibles en français (ex: "22 mai 2026").
3.  **Choix des Couleurs (Tailwind)** : N'utilisez pas de valeurs hexadécimales arbitraires dans vos classes Tailwind. Référez-vous aux couleurs thématiques configurées dans [tailwind.config.ts](file:///tailwind.config.ts) (ex: `text-brand-600`, `bg-brand-50`, `bg-slate-950`).
4.  **Icônes** : Utilisez exclusivement la bibliothèque **`lucide-react`**. Assurez-vous que les icônes de bouton ont des dimensions harmonisées (ex: `h-4 w-4` ou `h-4.5 w-4.5`).
5.  **Graphiques** : N'installez aucune bibliothèque tierce pour ajouter des visualisations de données. Dessinez vos graphiques en SVG natif en respectant la structure esthétique du composant graphique présent sur [le dashboard](file:///app/dashboard/page.tsx#L168-L247).
6.  **Gestion de la Base de Données (Actions)** : Toutes les requêtes vers la base de données doivent passer par le fichier [lib/actions/db.ts](file:///lib/actions/db.ts). Ces actions incluent un mécanisme de bascule automatique qui utilise les données simulées de [lib/mock-data.ts](file:///lib/mock-data.ts) si les variables d'environnement Supabase ne sont pas configurées, afin d'assurer le fonctionnement de la démo. Conservez cette logique.
7.  **Support de l'Impression** : Lors de la modification des pages de visualisation de factures, ajoutez la classe CSS `no-print` sur tous les boutons d'action ou barres d'outils, et utilisez `print-shadow-none` sur le conteneur principal de la facture pour éviter les ombres inesthétiques à l'impression.
