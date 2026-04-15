// backend/routes/postsRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Create posts table if not exists
const createPostsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        shares_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_shares (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_posts (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      )
    `);

    console.log("✅ Posts tables created successfully");
  } catch (err) {
    console.error("❌ Error creating posts tables:", err);
  }
};

// Initialize tables on route load
createPostsTable();

// Create a post
router.post("/", async (req, res) => {
  try {
    const { userId, content, imageUrl } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        error: "userId and content are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, content, image_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, content, imageUrl || null]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Create Post Error:", err);
    res.status(500).json({
      success: false,
      error: "Error creating post",
      details: err.message
    });
  }
});

// Get all posts (feed)
router.get("/feed", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT p.*, 
              up.name as user_name,
              up.bio as user_bio,
              up.profile_picture as user_profile_picture
       FROM posts p
       LEFT JOIN user_profiles up ON up.user_id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get likes, comments, and shares for each post
    const postsWithDetails = await Promise.all(
      result.rows.map(async (post) => {
        const likesResult = await pool.query(
          "SELECT user_id FROM post_likes WHERE post_id = $1",
          [post.id]
        );
        const commentsResult = await pool.query(
          `SELECT pc.*, up.name as user_name, up.profile_picture as user_profile_picture
           FROM post_comments pc
           LEFT JOIN user_profiles up ON up.user_id = pc.user_id
           WHERE pc.post_id = $1
           ORDER BY pc.created_at DESC
           LIMIT 5`,
          [post.id]
        );
        const sharesResult = await pool.query(
          "SELECT COUNT(*) as count FROM post_shares WHERE post_id = $1",
          [post.id]
        );

        return {
          ...post,
          likes: likesResult.rows.map(l => l.user_id),
          likes_count: likesResult.rows.length,
          comments: commentsResult.rows,
          comments_count: commentsResult.rows.length,
          shares_count: parseInt(sharesResult.rows[0]?.count || 0)
        };
      })
    );

    res.json({
      success: true,
      data: postsWithDetails
    });
  } catch (err) {
    console.error("❌ Get Feed Error:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching feed",
      details: err.message
    });
  }
});

// Create notifications table if not exists
const createNotificationsTable = async () => {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Create new table with all columns
      await pool.query(`
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          link TEXT,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("✅ Notifications table created successfully");
    } else {
      // Table exists, check and add missing columns
      const columnsCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notifications'
      `);
      const columnNames = columnsCheck.rows.map(row => row.column_name);
      
      // Add type column if missing
      if (!columnNames.includes('type')) {
        await pool.query(`
          ALTER TABLE notifications 
          ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'general'
        `);
        await pool.query(`
          ALTER TABLE notifications 
          ALTER COLUMN type DROP DEFAULT
        `);
        console.log("✅ Added type column to notifications table");
      }
      
      // Add message column if missing
      if (!columnNames.includes('message')) {
        await pool.query(`
          ALTER TABLE notifications 
          ADD COLUMN message TEXT NOT NULL DEFAULT ''
        `);
        await pool.query(`
          ALTER TABLE notifications 
          ALTER COLUMN message DROP DEFAULT
        `);
        console.log("✅ Added message column to notifications table");
      }
      
      // Add title column if missing
      if (!columnNames.includes('title')) {
        await pool.query(`
          ALTER TABLE notifications 
          ADD COLUMN title TEXT NOT NULL DEFAULT ''
        `);
        await pool.query(`
          ALTER TABLE notifications 
          ALTER COLUMN title DROP DEFAULT
        `);
        console.log("✅ Added title column to notifications table");
      }
      
      // Add link column if missing
      if (!columnNames.includes('link')) {
        await pool.query(`
          ALTER TABLE notifications 
          ADD COLUMN link TEXT
        `);
        console.log("✅ Added link column to notifications table");
      }
    }
  } catch (err) {
    console.error("❌ Error creating notifications table:", err);
  }
};

// Initialize notifications table
createNotificationsTable();

// Like/Unlike a post
router.post("/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    // Get post owner
    const post = await pool.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [postId]
    );

    if (post.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    const postOwnerId = post.rows[0].user_id;

    // Check if already liked
    const existing = await pool.query(
      "SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, userId]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await pool.query(
        "DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2",
        [postId, userId]
      );
      res.json({ success: true, liked: false });
    } else {
      // Like
      await pool.query(
        "INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)",
        [postId, userId]
      );
      
      // Create notification for post owner (if not liking own post)
      if (postOwnerId !== userId) {
        const likerProfile = await pool.query(
          "SELECT name FROM user_profiles WHERE user_id = $1",
          [userId]
        );
        const likerName = likerProfile.rows[0]?.name || "Someone";
        
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, link)
           VALUES ($1, 'post_like', 'New Like', $2, $3)`,
          [
            postOwnerId,
            `${likerName} liked your post`,
            `/home`
          ]
        );
      }
      
      res.json({ success: true, liked: true });
    }
  } catch (err) {
    console.error("❌ Like Post Error:", err);
    res.status(500).json({
      success: false,
      error: "Error liking post",
      details: err.message
    });
  }
});

// Comment on a post
router.post("/:postId/comment", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        error: "userId and content are required"
      });
    }

    // Get post owner
    const post = await pool.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [postId]
    );

    if (post.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    const postOwnerId = post.rows[0].user_id;

    const result = await pool.query(
      `INSERT INTO post_comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [postId, userId, content]
    );

    // Get user name
    const userProfile = await pool.query(
      "SELECT name FROM user_profiles WHERE user_id = $1",
      [userId]
    );

    const commenterName = userProfile.rows[0]?.name || "Someone";

    // Create notification for post owner (if not commenting on own post)
    if (postOwnerId !== userId) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'post_comment', 'New Comment', $2, $3)`,
        [
          postOwnerId,
          `${commenterName} commented on your post`,
          `/home`
        ]
      );
    }

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        user_name: commenterName
      }
    });
  } catch (err) {
    console.error("❌ Comment Post Error:", err);
    res.status(500).json({
      success: false,
      error: "Error commenting on post",
      details: err.message
    });
  }
});

// Share a post
router.post("/:postId/share", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    // Get post owner
    const post = await pool.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [postId]
    );

    if (post.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    const postOwnerId = post.rows[0].user_id;

    const result = await pool.query(
      `INSERT INTO post_shares (post_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [postId, userId]
    );

    // Create notification for post owner (if not sharing own post)
    if (postOwnerId !== userId) {
      const sharerProfile = await pool.query(
        "SELECT name FROM user_profiles WHERE user_id = $1",
        [userId]
      );
      const sharerName = sharerProfile.rows[0]?.name || "Someone";
      
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'post_share', 'Post Shared', $2, $3)`,
        [
          postOwnerId,
          `${sharerName} shared your post`,
          `/home`
        ]
      );
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Share Post Error:", err);
    res.status(500).json({
      success: false,
      error: "Error sharing post",
      details: err.message
    });
  }
});

// Get user's posts
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, 
              up.name as user_name,
              up.bio as user_bio,
              up.profile_picture as user_profile_picture
       FROM posts p
       LEFT JOIN user_profiles up ON up.user_id = p.user_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    const postsWithDetails = await Promise.all(
      result.rows.map(async (post) => {
        const likesResult = await pool.query(
          "SELECT user_id FROM post_likes WHERE post_id = $1",
          [post.id]
        );
        const commentsResult = await pool.query(
          `SELECT pc.*, up.name as user_name, up.profile_picture as user_profile_picture
           FROM post_comments pc
           LEFT JOIN user_profiles up ON up.user_id = pc.user_id
           WHERE pc.post_id = $1
           ORDER BY pc.created_at DESC`,
          [post.id]
        );
        const sharesResult = await pool.query(
          "SELECT COUNT(*) as count FROM post_shares WHERE post_id = $1",
          [post.id]
        );

        return {
          ...post,
          likes: likesResult.rows.map(l => l.user_id),
          likes_count: likesResult.rows.length,
          comments: commentsResult.rows,
          comments_count: commentsResult.rows.length,
          shares_count: parseInt(sharesResult.rows[0]?.count || 0)
        };
      })
    );

    res.json({
      success: true,
      data: postsWithDetails
    });
  } catch (err) {
    console.error("❌ Get User Posts Error:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching user posts",
      details: err.message
    });
  }
});

// Delete a post
router.delete("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    // Verify ownership
    const post = await pool.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [postId]
    );

    if (post.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    if (post.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this post"
      });
    }

    await pool.query("DELETE FROM posts WHERE id = $1", [postId]);

    res.json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (err) {
    console.error("❌ Delete Post Error:", err);
    res.status(500).json({
      success: false,
      error: "Error deleting post",
      details: err.message
    });
  }
});

// Save/Unsave a post
router.post("/:postId/save", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    // Check if already saved
    const existing = await pool.query(
      "SELECT * FROM saved_posts WHERE post_id = $1 AND user_id = $2",
      [postId, userId]
    );

    if (existing.rows.length > 0) {
      // Unsave
      await pool.query(
        "DELETE FROM saved_posts WHERE post_id = $1 AND user_id = $2",
        [postId, userId]
      );
      res.json({ success: true, saved: false });
    } else {
      // Save
      await pool.query(
        "INSERT INTO saved_posts (post_id, user_id) VALUES ($1, $2)",
        [postId, userId]
      );
      res.json({ success: true, saved: true });
    }
  } catch (err) {
    console.error("❌ Save Post Error:", err);
    res.status(500).json({
      success: false,
      error: "Error saving post",
      details: err.message
    });
  }
});

// Get saved posts for a user
router.get("/saved/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // First get saved post IDs
    const savedResult = await pool.query(
      `SELECT post_id, created_at as saved_at
       FROM saved_posts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    if (savedResult.rows.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const postIds = savedResult.rows.map(row => row.post_id);
    
    // Then get posts with details
    const result = await pool.query(
      `SELECT p.*, 
              up.name as user_name,
              up.bio as user_bio
       FROM posts p
       LEFT JOIN user_profiles up ON up.user_id = p.user_id
       WHERE p.id = ANY($1::int[])`,
      [postIds]
    );

    const postsWithDetails = await Promise.all(
      result.rows.map(async (post) => {
        // Get counts
        const likesResult = await pool.query(
          "SELECT user_id FROM post_likes WHERE post_id = $1",
          [post.id]
        );
        const commentsResult = await pool.query(
          `SELECT pc.*, up.name as user_name, up.profile_picture as user_profile_picture
           FROM post_comments pc
           LEFT JOIN user_profiles up ON up.user_id = pc.user_id
           WHERE pc.post_id = $1
           ORDER BY pc.created_at DESC`,
          [post.id]
        );
        const sharesResult = await pool.query(
          "SELECT COUNT(*) as count FROM post_shares WHERE post_id = $1",
          [post.id]
        );

        return {
          ...post,
          likes: likesResult.rows.map(l => l.user_id),
          likes_count: likesResult.rows.length,
          comments: commentsResult.rows,
          comments_count: commentsResult.rows.length,
          shares_count: parseInt(sharesResult.rows[0]?.count || 0)
        };
      })
    );

    // Sort by saved_at
    const savedMap = new Map(savedResult.rows.map(row => [row.post_id, row.saved_at]));
    postsWithDetails.sort((a, b) => {
      const aSaved = savedMap.get(a.id) || a.created_at;
      const bSaved = savedMap.get(b.id) || b.created_at;
      return new Date(bSaved).getTime() - new Date(aSaved).getTime();
    });

    res.json({
      success: true,
      data: postsWithDetails
    });
  } catch (err) {
    console.error("❌ Get Saved Posts Error:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching saved posts",
      details: err.message
    });
  }
});

// Get shared posts for a user
router.get("/shared/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // First get shared post IDs
    const sharedResult = await pool.query(
      `SELECT post_id, created_at as shared_at
       FROM post_shares
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    if (sharedResult.rows.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const postIds = sharedResult.rows.map(row => row.post_id);
    
    // Then get posts with details
    const result = await pool.query(
      `SELECT p.*, 
              up.name as user_name,
              up.bio as user_bio
       FROM posts p
       LEFT JOIN user_profiles up ON up.user_id = p.user_id
       WHERE p.id = ANY($1::int[])`,
      [postIds]
    );

    const postsWithDetails = await Promise.all(
      result.rows.map(async (post) => {
        // Get counts
        const likesResult = await pool.query(
          "SELECT user_id FROM post_likes WHERE post_id = $1",
          [post.id]
        );
        const commentsResult = await pool.query(
          `SELECT pc.*, up.name as user_name, up.profile_picture as user_profile_picture
           FROM post_comments pc
           LEFT JOIN user_profiles up ON up.user_id = pc.user_id
           WHERE pc.post_id = $1
           ORDER BY pc.created_at DESC`,
          [post.id]
        );
        const sharesResult = await pool.query(
          "SELECT COUNT(*) as count FROM post_shares WHERE post_id = $1",
          [post.id]
        );

        return {
          ...post,
          likes: likesResult.rows.map(l => l.user_id),
          likes_count: likesResult.rows.length,
          comments: commentsResult.rows,
          comments_count: commentsResult.rows.length,
          shares_count: parseInt(sharesResult.rows[0]?.count || 0)
        };
      })
    );

    // Sort by shared_at
    const sharedMap = new Map(sharedResult.rows.map(row => [row.post_id, row.shared_at]));
    postsWithDetails.sort((a, b) => {
      const aShared = sharedMap.get(a.id) || a.created_at;
      const bShared = sharedMap.get(b.id) || b.created_at;
      return new Date(bShared).getTime() - new Date(aShared).getTime();
    });

    res.json({
      success: true,
      data: postsWithDetails
    });
  } catch (err) {
    console.error("❌ Get Shared Posts Error:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching shared posts",
      details: err.message
    });
  }
});

// Get notifications for a user
router.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("❌ Get Notifications Error:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching notifications",
      details: err.message
    });
  }
});

// Get unread notification count for a user
router.get("/notifications/:userId/unread-count", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      count: parseInt(result.rows[0]?.count || 0)
    });
  } catch (err) {
    console.error("❌ Get Unread Count Error:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching unread count",
      details: err.message
    });
  }
});

// Mark notification as read
router.put("/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await pool.query(
      `UPDATE notifications 
       SET read = TRUE 
       WHERE id = $1`,
      [notificationId]
    );

    res.json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (err) {
    console.error("❌ Mark Notification Read Error:", err);
    res.status(500).json({
      success: false,
      error: "Error marking notification as read",
      details: err.message
    });
  }
});

// Mark all notifications as read for a user
router.put("/notifications/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;
    
    await pool.query(
      `UPDATE notifications 
       SET read = TRUE 
       WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (err) {
    console.error("❌ Mark All Notifications Read Error:", err);
    res.status(500).json({
      success: false,
      error: "Error marking all notifications as read",
      details: err.message
    });
  }
});

module.exports = router;

