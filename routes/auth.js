import express from 'express';
import { getGameState, addPlayer, updatePlayer } from '../utils/dataManager.js';

const router = express.Router();

// Выбор роли и вход в игру
router.post('/join', (req, res) => {
    try {
        const { name, role } = req.body;
        
        console.log('Join request:', { name, role });
        
        // Валидация входных данных
        if (!name || !name.trim()) {
            return res.status(400).json({ 
                error: 'Имя обязательно для входа' 
            });
        }
        
        if (!role || !['player', 'gm'].includes(role)) {
            return res.status(400).json({ 
                error: 'Роль должна быть "player" или "gm"' 
            });
        }
        
        // Создаем игрока
        const player = addPlayer({ 
            name: name.trim(), 
            role: role 
        });
        
        const gameState = getGameState();
        
        console.log('Player created:', player.id);
        
        // Успешный ответ
        res.json({ 
            success: true,
            player: {
                id: player.id,
                name: player.name,
                role: player.role,
                ready: player.ready,
                team: player.team
            },
            gameState: gameState
        });
        
    } catch (error) {
        console.error('Error in /join:', error);
        res.status(500).json({ 
            error: 'Внутренняя ошибка сервера' 
        });
    }
});

// Получение информации о текущем игроке
router.get('/me', (req, res) => {
    try {
        const playerId = req.query.playerId || req.headers['x-player-id'];
        
        if (!playerId) {
            return res.status(400).json({ 
                error: 'Player ID is required' 
            });
        }
        
        const gameState = getGameState();
        const player = gameState.players[playerId];
        
        if (!player) {
            return res.status(404).json({ 
                error: 'Player not found' 
            });
        }
        
        res.json({ 
            player: {
                id: player.id,
                name: player.name,
                role: player.role,
                ready: player.ready,
                team: player.team,
                character: player.character,
                class: player.class,
                stats: player.stats
            }
        });
        
    } catch (error) {
        console.error('Error in /me:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

// Выбор персонажа
router.post('/select-character', (req, res) => {
    try {
        const { playerId, character, characterClass } = req.body;
        
        if (!playerId) {
            return res.status(400).json({ 
                error: 'Player ID is required' 
            });
        }
        
        if (!character || !characterClass) {
            return res.status(400).json({ 
                error: 'Character and class are required' 
            });
        }
        
        const updatedPlayer = updatePlayer(playerId, { 
            character, 
            class: characterClass,
            stats: getStatsForClass(characterClass)
        });
        
        if (!updatedPlayer) {
            return res.status(404).json({ 
                error: 'Player not found' 
            });
        }
        
        res.json({ 
            success: true,
            player: updatedPlayer 
        });
        
    } catch (error) {
        console.error('Error in /select-character:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

// Готовность игрока
router.post('/toggle-ready', (req, res) => {
    try {
        const { playerId } = req.body;
        
        if (!playerId) {
            return res.status(400).json({ 
                error: 'Player ID is required' 
            });
        }
        
        const gameState = getGameState();
        const player = gameState.players[playerId];
        
        if (!player) {
            return res.status(404).json({ 
                error: 'Player not found' 
            });
        }
        
        const updatedPlayer = updatePlayer(playerId, { 
            ready: !player.ready 
        });
        
        res.json({ 
            success: true,
            player: updatedPlayer 
        });
        
    } catch (error) {
        console.error('Error in /toggle-ready:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

// Вспомогательная функция для статов персонажа
function getStatsForClass(characterClass) {
    const stats = {
        warrior: { strength: 8, dexterity: 5, intelligence: 3 },
        rogue: { strength: 4, dexterity: 9, intelligence: 5 },
        wizard: { strength: 2, dexterity: 4, intelligence: 10 },
        bard: { strength: 3, dexterity: 6, intelligence: 7 },
        paladin: { strength: 7, dexterity: 4, intelligence: 5 },
        ranger: { strength: 5, dexterity: 8, intelligence: 4 },
        cleric: { strength: 5, dexterity: 4, intelligence: 6 }
    };
    
    return stats[characterClass] || stats.warrior;
}

export default router;