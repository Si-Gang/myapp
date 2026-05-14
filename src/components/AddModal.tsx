import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimeWheel from './DateTimeWheel';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, deadline: Date, description: string) => void;
  initialTitle?: string;
  initialDescription?: string;
  initialDeadline?: Date;
}

export default function AddModal({
  visible,
  onClose,
  onSubmit,
  initialTitle = '',
  initialDescription = '',
  initialDeadline,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [deadline, setDeadline] = useState(initialDeadline ?? new Date());
  const [descExpanded, setDescExpanded] = useState(!!initialDescription);

  const handleOpen = () => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setDeadline(initialDeadline ?? new Date());
    setDescExpanded(!!initialDescription);
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed, deadline, descExpanded ? description.trim() : '');
    setTitle('');
    setDescription('');
    setDeadline(new Date());
    setDescExpanded(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={handleOpen}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>
            {initialTitle ? '编辑日程' : '新建日程'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="日程标题"
            placeholderTextColor="#B2BEC3"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          {descExpanded ? (
            <TextInput
              style={[styles.input, styles.descInput]}
              placeholder="添加描述（选填）"
              placeholderTextColor="#B2BEC3"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              autoFocus={false}
            />
          ) : (
            <TouchableOpacity
              style={styles.addDescBtn}
              onPress={() => setDescExpanded(true)}
            >
              <Text style={styles.addDescText}>+ 添加描述</Text>
            </TouchableOpacity>
          )}

          <DateTimeWheel value={deadline} onChange={setDeadline} />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={handleSubmit}
            >
              <Text style={styles.confirmText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3436',
    marginBottom: 10,
  },
  descInput: {
    minHeight: 56,
  },
  addDescBtn: {
    paddingVertical: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  addDescText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F0F0F0',
  },
  cancelText: {
    fontSize: 16,
    color: '#636E72',
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: '#FF6B35',
  },
  confirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
});
