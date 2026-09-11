package com.example.mylifecalendar.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.mylifecalendar.data.model.DayRemark
import kotlinx.coroutines.flow.Flow

@Dao
interface DayRemarkDao {
    @Query("SELECT * FROM day_remarks")
    fun getAllRemarks(): Flow<List<DayRemark>>

    @Query("SELECT * FROM day_remarks WHERE date = :date LIMIT 1")
    fun getRemarkByDate(date: String): Flow<DayRemark?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setRemark(remark: DayRemark)

    @Query("DELETE FROM day_remarks WHERE date = :date")
    suspend fun deleteRemark(date: String)
}
