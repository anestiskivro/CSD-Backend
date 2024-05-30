module.exports = (sequelize,DataTypes) => {
    const Comments = sequelize.define('Comments', {
        comid: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'students',
                key: 'id'
            }
        },
        eid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'exams',
                key: 'eid'
            }
        },
        cid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'courses',
                key: 'cid'
            }
        },
        date: {
            type: DataTypes.STRING,
            allowNull: false
        },
        FromTime: {
            type: DataTypes.STRING,
            allowNull: false
        },
        EndTime: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Comment: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        timestamps: false
    });
    return Comments;
};