
// LEADS
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    let filter = {};
    if (req.query.userId && req.query.userId !== '') {
      let targetId = req.query.userId;
      let targetUser = null;

      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        targetUser = await User.findOne({ username: targetId });
      } else {
        targetUser = await User.findById(targetId);
      }

      if (targetUser) {
        filter = {
          $or: [
            { userId: targetUser._id },
            { consultant: targetUser.username }
          ]
        };
      }
    }
      
    const leads = await Lead.find(filter).populate('userId', 'username').sort({ createdAt: -1 });
    const leadsWithUser = leads.map(l => ({
      ...l.toObject(),
      ownerName: l.userId?.username || 'Sistema'
    }));
    res.json(leadsWithUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SALVAR/ATUALIZAR LEAD (UPSERT ROBUSTO)
app.post('/api/leads', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    let query = {};

    // 1. Tenta identificar o lead por _id, ID numérico ou Nome
    if (data._id && mongoose.Types.ObjectId.isValid(data._id)) {
      query = { _id: data._id };
    } else if (data.id) {
      query = { id: data.id };
    } else if (data.name) {
      query = { name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') } };
    }

    // 2. Sincroniza o dono do lead pelo nome do consultor
    if (data.consultant) {
      const u = await User.findOne({ username: data.consultant });
      if (u) data.userId = u._id;
    }

    // 3. Executa o UPSERT (Atualiza se existir, cria se não)
    const updatedLead = await Lead.findOneAndUpdate(
      query,
      { $set: data },
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`✅ Lead ${updatedLead.name} salvo/atualizado com sucesso por ${req.user.username}`);
    res.json(updatedLead);
  } catch (err) {
    console.error('❌ Erro ao salvar lead:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    let query = {};

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { id: id };
    }

    if (data.consultant) {
      const u = await User.findOne({ username: data.consultant });
      if (u) data.userId = u._id;
    }

    const updatedLead = await Lead.findOneAndUpdate(
      query,
      { $set: data },
      { upsert: true, new: true }
    );
    res.json(updatedLead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Lead.findByIdAndDelete(id);
    } else {
      await Lead.deleteOne({ id });
    }
    res.json({ message: 'Lead removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
