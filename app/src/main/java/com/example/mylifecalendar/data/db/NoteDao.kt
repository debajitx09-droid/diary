package com.example.mylifecalendar.data.db

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.mylifecalendar.data.model.NoteEntry
import kotlinx.coroutines.flow.Flow

@Dao
interface NoteDao {
    @Query("SELECT * FROM notes ORDER BY date DESC, createdAt DESC")
    fun getAllNotes(): Flow<List<NoteEntry>>

    @Query("SELECT * FROM notes WHERE date = :date ORDER BY createdAt DESC")
    fun getNotesByDate(date: String): Flow<List<NoteEntry>>

    @Query("SELECT * FROM notes WHERE id = :id LIMIT 1")
    suspend fun getNoteById(id: String): NoteEntry?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: NoteEntry)

    @Update
    suspend fun updateNote(note: NoteEntry)

    @Delete
    suspend fun deleteNote(note: NoteEntry)

    @Query("DELETE FROM notes WHERE id = :id")
    suspend fun deleteNoteById(id: String)
}
