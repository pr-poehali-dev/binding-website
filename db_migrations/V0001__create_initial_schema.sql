-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_info table for admin-editable content
CREATE TABLE IF NOT EXISTS game_info (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    cover_url TEXT,
    steam_url TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, is_admin) 
VALUES ('admin', 'admin123', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Insert default game info
INSERT INTO game_info (title, description, cover_url, steam_url)
VALUES (
    'The Binding of Isaac: Rebirth',
    'Культовая roguelike-игра с мрачной атмосферой и бесконечной реиграбельностью. Погрузитесь в подземелья, полные опасностей, секретов и уникальных предметов.',
    'https://cdn.poehali.dev/files/13c3ecbd-b913-441e-a99b-26ba68eba37e.png',
    'https://store.steampowered.com/app/113200/The_Binding_of_Isaac/'
);